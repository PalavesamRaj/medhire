import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearEditProfileOverrides, loadEditProfileOverrides, loadProfileDraft, saveProfileDraft } from '../lib/candidateProfileDraft'
import { getAccessToken, getAuthenticatedUser } from '../lib/authSession'
import { candidateProfileApi, getCandidatePhotoUrl, getCandidateResumeRecord } from '../lib/candidateProfileApi'
import { candidateDashboardApi } from '../lib/candidateDashboardApi'
import { toMonthlySalaryAmount } from '../lib/currency'

const CandidateProfileContext = createContext(null)
const unwrap = (response) => {
  let value = response
  for (let depth = 0; depth < 6 && value && typeof value === 'object' && !Array.isArray(value); depth += 1) {
    // The profile endpoint returns `data.profile` (photo metadata) alongside
    // sibling sections such as `data.personal`, `data.professional`, and
    // `data.preferences`. Keep that data envelope intact instead of unwrapping
    // into the small `profile` object and losing the persisted sections.
    const hasProfileSections = ['personal', 'personalInformation', 'personal_information', 'professional', 'professionalInformation', 'professional_information', 'education', 'experience', 'workExperience', 'work_experience', 'skills', 'certifications', 'preferences', 'careerPreferences', 'career_preferences', 'resumes']
      .some((key) => value[key] !== undefined)
    const nested = value.data ?? (hasProfileSections ? null : value.profile) ?? value.candidateProfile ?? value.candidate_profile ?? value.candidate ?? value.result
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) break
    value = nested
  }
  return value || {}
}
const countryNames = { US: 'United States', IN: 'India', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia', OTHER: 'Other' }
const genderNames = { female: 'Female', male: 'Male', 'non-binary': 'Non-binary', non_binary: 'Non-binary', 'non binary': 'Non-binary', 'prefer not to say': 'Prefer not to say', 'self-describe': 'Self-describe', self_describe: 'Self-describe' }
const employmentLabels = { FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', TEMPORARY: 'Temporary', PER_DIEM: 'Per Diem', INTERNSHIP: 'Internship' }
const preferenceLabels = {
  workSetting: { ONSITE: 'On-site', ON_SITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote' },
  shiftPreference: { DAY: 'Day', NIGHT: 'Night', ROTATING: 'Rotating', FLEXIBLE: 'Flexible' },
  salaryType: { ANNUAL: 'Annual', YEARLY: 'Annual', MONTHLY: 'Monthly', HOURLY: 'Hourly' },
  remotePreference: { ONSITE: 'On-site', ON_SITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote', NO_PREFERENCE: 'No preference' },
}
const preferenceValue = (field, value) => {
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first !== 'string') return first ?? ''
  const normalized = first.toUpperCase().replace(/[ -]/g, '_')
  return preferenceLabels[field]?.[normalized] || first
}
const dateInputValue = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value || ''
const preferProfileRows = (remote, cached) => Array.isArray(remote) && (remote.length || !cached?.length) ? remote : cached || []
const withAliases = (value = {}, aliases = {}) => {
  const result = { ...value }
  for (const [field, names] of Object.entries(aliases)) {
    if (result[field] !== undefined && result[field] !== null) continue
    const alias = names.find((name) => value[name] !== undefined && value[name] !== null)
    if (alias) result[field] = value[alias]
  }
  return result
}
const mergeCachedFields = (cached = {}, remote = {}) => {
  const merged = { ...cached, ...remote }
  for (const [key, value] of Object.entries(remote)) {
    if ((value === '' || value == null) && cached[key] !== undefined) merged[key] = cached[key]
  }
  return merged
}
const normalizeRows = (rows, aliases) => rows.map((row) => withAliases(row, aliases))
const normalizeSkills = (skills) => (Array.isArray(skills) ? skills : []).map((skill) => {
  if (typeof skill === 'string') return skill.trim()
  if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return ''
  const name = skill.name ?? skill.skillName ?? skill.skill_name ?? skill.label ?? skill.value
  return typeof name === 'string' ? name.trim() : ''
}).filter(Boolean).map((name) => ({ name }))
function normalizeProfile(response) {
  const raw = unwrap(response)
  const draft = loadProfileDraft()
  const authUser = getAuthenticatedUser() || {}
  // Some API versions return section objects; others return the same fields at
  // the profile root. Normalize both so the dashboard and editor read one shape.
  const personalData = { ...raw, ...(raw.personalInformation || raw.personal_information || raw.personalInfo || raw.personal_info || raw.personal || {}) }
  const professionalData = { ...raw, ...(raw.professionalInformation || raw.professional_information || raw.professionalInfo || raw.professional_info || raw.professional || {}) }
  const personalAliases = withAliases(personalData, {
    firstName: ['first_name'], lastName: ['last_name'], phoneNumber: ['phone_number', 'phone'],
    dateOfBirth: ['date_of_birth', 'dob'], country: ['country_code'], city: ['city_name'], state: ['state_name'], zipCode: ['zip_code', 'postalCode', 'postal_code'],
  })
  const fullName = personalData.fullName || personalData.full_name || personalData.name || authUser.fullName || authUser.full_name || authUser.name
  if (!personalAliases.firstName && fullName) personalAliases.firstName = String(fullName).trim().split(/\s+/)[0] || ''
  if (!personalAliases.lastName && fullName) personalAliases.lastName = String(fullName).trim().split(/\s+/).slice(1).join(' ')
  if (!personalAliases.city && typeof personalAliases.location === 'string') {
    const [city, ...stateParts] = personalAliases.location.split(',')
    personalAliases.city = city.trim()
    if (!personalAliases.state && stateParts.length) personalAliases.state = stateParts.join(',').trim()
  }
  const personal = mergeCachedFields(draft.personalInformation, personalAliases)
  const serverProfessional = withAliases(professionalData, {
    currentJobTitle: ['current_job_title', 'headline', 'jobTitle', 'job_title', 'title'], yearsOfExperience: ['years_of_experience'], currentEmployer: ['current_employer'],
    professionalSummary: ['professional_summary', 'summary'], licenseNumber: ['license_number'], licenseState: ['license_state'], npiNumber: ['npi_number'],
  })
  const professional = mergeCachedFields(draft.professionalInformation, serverProfessional)
  // Keep the values last saved from Edit Profile visible if the profile GET
  // endpoint is temporarily returning an older snapshot. Once GET catches up,
  // it naturally returns the same values and this local fallback is inert.
  const editOverrides = loadEditProfileOverrides()
  const currentServerLocation = [personalAliases.city, personalAliases.state].filter(Boolean).join(', ')
  const matchedOverrides = [
    editOverrides.firstName !== undefined && personalAliases.firstName === editOverrides.firstName && 'firstName',
    editOverrides.lastName !== undefined && personalAliases.lastName === editOverrides.lastName && 'lastName',
    editOverrides.location !== undefined && currentServerLocation === editOverrides.location && 'location',
    editOverrides.headline !== undefined && serverProfessional.currentJobTitle === editOverrides.headline && 'headline',
    editOverrides.summary !== undefined && serverProfessional.professionalSummary === editOverrides.summary && 'summary',
  ].filter(Boolean)
  if (matchedOverrides.length) clearEditProfileOverrides(matchedOverrides)
  if (editOverrides.firstName !== undefined) personal.firstName = editOverrides.firstName
  if (editOverrides.lastName !== undefined) personal.lastName = editOverrides.lastName
  if (editOverrides.location !== undefined) {
    const [city = '', ...stateParts] = editOverrides.location.split(',')
    personal.city = city.trim()
    personal.state = stateParts.join(',').trim()
  }
  if (editOverrides.headline !== undefined) professional.currentJobTitle = editOverrides.headline
  if (editOverrides.summary !== undefined) professional.professionalSummary = editOverrides.summary
  const dateOfBirth = personal.dateOfBirth
  const education = normalizeRows(preferProfileRows(raw.education || raw.educationHistory || raw.education_history, draft.education), { fieldOfStudy: ['field_of_study'], institutionName: ['institution_name'], graduationYear: ['graduation_year'] })
  const workExperience = normalizeRows(preferProfileRows(raw.workExperience || raw.work_experience || raw.experience, draft.workExperience), {
    jobTitle: ['job_title'], employerName: ['employer_name'], employmentType: ['employment_type'], startMonth: ['start_month'], startYear: ['start_year'],
    endMonth: ['end_month'], endYear: ['end_year'], currentlyWorking: ['currently_working'],
  }).map((item) => ({ ...item, employmentType: employmentLabels[item.employmentType] || item.employmentType }))
  const certifications = normalizeRows(preferProfileRows(raw.certifications || raw.certificationHistory || raw.certification_history, draft.certifications), {
    certificationName: ['certification_name'], issuingOrganization: ['issuing_organization'], credentialId: ['credential_id'],
    issueDate: ['issue_date'], expiryDate: ['expiry_date'], doesNotExpire: ['does_not_expire'],
  })
  return {
    ...draft,
    ...raw,
    personalInformation: {
      ...personal,
      firstName: personal.firstName || authUser.firstName || authUser.first_name || authUser.fullName?.split?.(/\s+/)[0] || raw.fullName?.split?.(/\s+/)[0] || '',
      lastName: personal.lastName || authUser.lastName || authUser.last_name || authUser.fullName?.split?.(/\s+/).slice(1).join(' ') || raw.fullName?.split?.(/\s+/).slice(1).join(' ') || '',
      phoneNumber: personal.phoneNumber || authUser.phoneNumber || authUser.phone_number || authUser.phone || '',
      country: countryNames[personal.country] || personal.country || '',
      gender: typeof personal.gender === 'string' ? genderNames[personal.gender.toLowerCase()] || personal.gender : personal.gender,
      dateOfBirth: typeof dateOfBirth === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateOfBirth) ? dateOfBirth.slice(0, 10) : dateOfBirth,
    },
    professionalInformation: {
      ...professional,
      yearsOfExperience: (() => {
        const years = professional.yearsOfExperience
        if (years === null || years === undefined || years === '') return ''
        const value = Number(years)
        if (!Number.isFinite(value)) return years
        if (value < 1) return 'Less than 1 year'
        if (value <= 2) return '1–2 years'
        if (value <= 5) return '3–5 years'
        if (value <= 10) return '6–10 years'
        if (value <= 15) return '11–15 years'
        return '16+ years'
      })(),
    },
    education,
    workExperience,
    skills: normalizeSkills(preferProfileRows(Array.isArray(raw.skills) ? raw.skills : raw.skills?.skills, draft.skills)),
    certifications,
    careerPreferences: (() => {
      const preferenceData = raw.careerPreferences || raw.career_preferences || raw.preferences || raw.jobPreferences || raw.job_preferences || {}
      const normalizedPreferences = withAliases(preferenceData, {
        desiredJobTitle: ['desired_job_title'], preferredSpecialties: ['preferred_specialties'], employmentTypes: ['employment_types'],
        preferredLocations: ['preferred_locations'], workSetting: ['work_setting'], shiftPreference: ['shift_preference'], expectedSalary: ['expected_salary'],
        salaryType: ['salary_type'], availableFrom: ['available_from'], willingToRelocate: ['willing_to_relocate'], remotePreference: ['remote_preference'],
      })
      const preferences = mergeCachedFields(draft.careerPreferences, normalizedPreferences)
      for (const key of ['preferredSpecialties', 'employmentTypes', 'preferredLocations']) {
        if (Array.isArray(normalizedPreferences[key]) && normalizedPreferences[key].length === 0 && draft.careerPreferences[key]?.length) preferences[key] = draft.careerPreferences[key]
      }
      return {
        ...preferences,
        expectedSalary: preferences.expectedSalary == null || preferences.expectedSalary === '' ? preferences.expectedSalary : toMonthlySalaryAmount(preferences.expectedSalary, preferences.salaryType),
        employmentTypes: (Array.isArray(preferences.employmentTypes) ? preferences.employmentTypes : []).map((type) => employmentLabels[type] || type),
        workSetting: preferenceValue('workSetting', preferences.workSetting),
        shiftPreference: preferenceValue('shiftPreference', preferences.shiftPreference),
        salaryType: preferences.expectedSalary != null && preferences.expectedSalary !== '' ? 'Monthly' : preferenceValue('salaryType', preferences.salaryType),
        remotePreference: preferenceValue('remotePreference', preferences.remotePreference),
        availableFrom: dateInputValue(preferences.availableFrom),
      }
    })(),
    resume: null,
    resumeMetadata: getCandidateResumeRecord(raw.resume || raw.resumeMetadata || raw.resume_metadata || raw.resumes) || null,
    photoUrl: getCandidatePhotoUrl(raw),
  }
}
export function CandidateProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfileDraft)
  const [submitted, setSubmitted] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [loading, setLoading] = useState(Boolean(getAccessToken()))
  const [resumeLoading, setResumeLoading] = useState(Boolean(getAccessToken()))
  const [profileError, setProfileError] = useState('')
  const [candidate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') } catch { return null }
  })
  useEffect(() => {
    let active = true
    if (!getAccessToken()) { setLoading(false); setResumeLoading(false); return () => { active = false } }
    candidateProfileApi.getCandidateProfile().then((response) => {
      if (!active) return
      const normalized = normalizeProfile(response)
      if (candidate?.email && !normalized.personalInformation.email) {
        normalized.personalInformation = { ...normalized.personalInformation, email: candidate.email }
      }
      setProfile((previous) => ({ ...normalized, resumeMetadata: normalized.resumeMetadata || previous.resumeMetadata }))
    }).catch((error) => {
      if (active) setProfileError(error?.message || 'Could not load your saved profile.')
    }).finally(() => { if (active) setLoading(false) })
    candidateDashboardApi.getResume().then((response) => {
      if (!active) return
      const savedResume = getCandidateResumeRecord(response)
      if (savedResume) setProfile((previous) => ({ ...previous, resumeMetadata: savedResume }))
    }).catch(() => { /* The profile response or saved draft can still provide resume metadata. */ })
      .finally(() => { if (active) setResumeLoading(false) })
    candidateProfileApi.getCandidateOnboarding().then((response) => {
      if (!active) return
      const progress = unwrap(response)
      setProfile((previous) => ({ ...previous, onboarding: progress }))
      setSubmitted(progress.profileCompleted === true || progress.status === 'COMPLETED')
    }).catch(() => { /* Profile loading does not depend on onboarding progress. */ })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const ok = saveProfileDraft(profile)
    setStorageError(ok ? '' : 'Your browser could not save a local profile backup. Please keep the API connection available and save again.')
  }, [profile, submitted])
  const updateSection = useCallback((section, value) => {
    setSubmitted(false)
    setProfile((previous) => ({ ...previous, [section]: typeof value === 'function' ? value(previous[section]) : value }))
  }, [])
  const completeProfile = () => { setSubmitted(true) }
  const saveSection = useCallback(async (section, data) => {
    const save = {
      personalInformation: candidateProfileApi.savePersonalInformation,
      professionalInformation: candidateProfileApi.saveProfessionalInformation,
      education: candidateProfileApi.saveEducation,
      workExperience: candidateProfileApi.saveWorkExperience,
      skills: candidateProfileApi.saveSkills,
      certifications: candidateProfileApi.saveCertifications,
      careerPreferences: candidateProfileApi.saveCareerPreferences,
    }[section]
    if (save) await save(data)
  }, [])
  return <CandidateProfileContext.Provider value={{ profile, updateSection, saveSection, submitted, setSubmitted, completeProfile, candidate, storageError, loading, resumeLoading, profileError }}>{children}</CandidateProfileContext.Provider>
}
export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext)
  if (!context) throw new Error('useCandidateProfile must be used inside CandidateProfileProvider')
  return context
}
