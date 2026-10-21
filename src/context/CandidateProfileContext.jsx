import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loadProfileDraft, saveProfileDraft } from '../lib/candidateProfileDraft'
import { getAccessToken } from '../lib/authSession'
import { candidateProfileApi } from '../lib/candidateProfileApi'

const CandidateProfileContext = createContext(null)
const unwrap = (response) => response?.data?.profile || response?.data?.candidate || response?.data || response?.profile || response?.candidate || response || {}
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
  const personalData = raw.personalInformation || raw.personal || raw.personal_info || {}
  const professionalData = raw.professionalInformation || raw.professional || raw.professional_info || {}
  const personal = { ...draft.personalInformation, ...withAliases(personalData, {
    firstName: ['first_name'], lastName: ['last_name'], phoneNumber: ['phone_number', 'phone'],
    dateOfBirth: ['date_of_birth', 'dob'], country: ['country_code'], city: ['city_name'], state: ['state_name'], zipCode: ['zip_code', 'postalCode', 'postal_code'],
  }) }
  const professional = { ...draft.professionalInformation, ...withAliases(professionalData, {
    currentJobTitle: ['current_job_title'], yearsOfExperience: ['years_of_experience'], currentEmployer: ['current_employer'],
    professionalSummary: ['professional_summary'], licenseNumber: ['license_number'], licenseState: ['license_state'], npiNumber: ['npi_number'],
  }) }
  const dateOfBirth = personal.dateOfBirth
  const education = normalizeRows(preferProfileRows(raw.education, draft.education), { fieldOfStudy: ['field_of_study'], institutionName: ['institution_name'], graduationYear: ['graduation_year'] })
  const workExperience = normalizeRows(preferProfileRows(raw.workExperience || raw.experience, draft.workExperience), {
    jobTitle: ['job_title'], employerName: ['employer_name'], employmentType: ['employment_type'], startMonth: ['start_month'], startYear: ['start_year'],
    endMonth: ['end_month'], endYear: ['end_year'], currentlyWorking: ['currently_working'],
  }).map((item) => ({ ...item, employmentType: employmentLabels[item.employmentType] || item.employmentType }))
  const certifications = normalizeRows(preferProfileRows(raw.certifications, draft.certifications), {
    certificationName: ['certification_name'], issuingOrganization: ['issuing_organization'], credentialId: ['credential_id'],
    issueDate: ['issue_date'], expiryDate: ['expiry_date'], doesNotExpire: ['does_not_expire'],
  })
  return {
    ...draft,
    ...raw,
    personalInformation: {
      ...personal,
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
      const preferenceData = raw.careerPreferences || raw.preferences || {}
      const preferences = { ...draft.careerPreferences, ...withAliases(preferenceData, {
        desiredJobTitle: ['desired_job_title'], preferredSpecialties: ['preferred_specialties'], employmentTypes: ['employment_types'],
        preferredLocations: ['preferred_locations'], workSetting: ['work_setting'], shiftPreference: ['shift_preference'], expectedSalary: ['expected_salary'],
        salaryType: ['salary_type'], availableFrom: ['available_from'], willingToRelocate: ['willing_to_relocate'], remotePreference: ['remote_preference'],
      }) }
      return {
        ...preferences,
        employmentTypes: (Array.isArray(preferences.employmentTypes) ? preferences.employmentTypes : []).map((type) => employmentLabels[type] || type),
        workSetting: preferenceValue('workSetting', preferences.workSetting),
        shiftPreference: preferenceValue('shiftPreference', preferences.shiftPreference),
        salaryType: preferenceValue('salaryType', preferences.salaryType),
        remotePreference: preferenceValue('remotePreference', preferences.remotePreference),
        availableFrom: dateInputValue(preferences.availableFrom),
      }
    })(),
    resume: null,
    resumeMetadata: raw.resume || raw.resumeMetadata || null,
    photoUrl: raw.photoUrl || raw.profilePhotoUrl || raw.profilePhoto?.url || raw.avatarUrl || '',
  }
}
export function CandidateProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfileDraft)
  const [submitted, setSubmitted] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [loading, setLoading] = useState(Boolean(getAccessToken()))
  const [profileError, setProfileError] = useState('')
  const [candidate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') } catch { return null }
  })
  useEffect(() => {
    let active = true
    if (!getAccessToken()) { setLoading(false); return () => { active = false } }
    Promise.allSettled([candidateProfileApi.getCandidateProfile(), candidateProfileApi.getCandidateOnboarding()]).then(([profileResult, onboardingResult]) => {
      if (!active) return
      if (profileResult.status === 'fulfilled') setProfile(normalizeProfile(profileResult.value))
      else setProfileError(profileResult.reason?.message || 'Could not load your saved profile.')
      if (onboardingResult.status === 'fulfilled') {
        const progress = unwrap(onboardingResult.value)
        setProfile((previous) => ({ ...previous, onboarding: progress }))
        setSubmitted(progress.profileCompleted === true || progress.status === 'COMPLETED')
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const ok = saveProfileDraft(profile)
    setStorageError(ok ? '' : 'Browser storage is unavailable. Keep this tab open to retain your changes.')
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
  return <CandidateProfileContext.Provider value={{ profile, updateSection, saveSection, submitted, setSubmitted, completeProfile, candidate, storageError, loading, profileError }}>{children}</CandidateProfileContext.Provider>
}
export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext)
  if (!context) throw new Error('useCandidateProfile must be used inside CandidateProfileProvider')
  return context
}
