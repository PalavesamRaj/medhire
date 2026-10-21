import { getAccessToken } from './authSession.js'
import { authedFetch } from './http'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const PROFILE_ENDPOINTS = {
  onboarding: '/candidates/me/onboarding', onboardingSteps: '/candidates/me/onboarding/steps',
  resume: '/candidates/me/resume', personal: '/candidates/me/personal', professional: '/candidates/me/professional',
  education: '/candidates/me/education', workExperience: '/candidates/me/experience', skills: '/candidates/me/skills',
  certifications: '/candidates/me/certifications', preferences: '/candidates/me/preferences',
  profile: '/candidates/me/profile', photo: '/candidates/me/profile/photo', submit: '/candidates/me/profile/complete',
}
const countryCodes = { 'United States': 'US', India: 'IN', Canada: 'CA', 'United Kingdom': 'GB', Australia: 'AU', Other: 'OTHER' }
export function toPersonalInformationPayload(data = {}) {
  const { email, ...fields } = data
  const payload = {
    ...fields,
    gender: typeof fields.gender === 'string' ? fields.gender.toLowerCase() : fields.gender,
    country: countryCodes[fields.country] || fields.country,
  }
  for (const field of ['address', 'state', 'zipCode']) if (!String(payload[field] || '').trim()) delete payload[field]
  // The verified backend only accepts two-letter country codes; leave an
  // existing country unchanged when the UI's legacy "Other" choice is used.
  if (payload.country === 'OTHER' || payload.country === 'Other') delete payload.country
  return payload
}
const employmentTypes = { 'Full Time': 'FULL_TIME', 'Part Time': 'PART_TIME', Contract: 'CONTRACT', Temporary: 'TEMPORARY', 'Per Diem': 'PER_DIEM', Internship: 'INTERNSHIP' }
const preferenceEnums = {
  workSetting: { 'On-site': 'ONSITE', Hybrid: 'HYBRID', Remote: 'REMOTE' },
  shiftPreference: { Day: 'DAY', Night: 'NIGHT', Rotating: 'ROTATING', Flexible: 'FLEXIBLE' },
  salaryType: { Annual: 'ANNUAL', Monthly: 'MONTHLY', Hourly: 'HOURLY' },
  remotePreference: { 'On-site': 'ONSITE', Hybrid: 'HYBRID', Remote: 'REMOTE', 'No preference': 'NO_PREFERENCE' },
}
const yearsByLabel = { 'Less than 1 year': 0, '1–2 years': 1, '3–5 years': 3, '6–10 years': 6, '11–15 years': 11, '16+ years': 16 }
function toProfessionalPayload(data = {}) {
  const years = data.yearsOfExperience
  return { ...data, yearsOfExperience: yearsByLabel[years] ?? years }
}
function toEmploymentValues(values) {
  return Array.isArray(values) ? values.map((value) => employmentTypes[value] || value) : values
}
const toPreferenceEnum = (field, value) => preferenceEnums[field]?.[value] || value
async function request(path, method = 'GET', data) {
  const multipart = data instanceof FormData
  const token = getAccessToken()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await authedFetch(`${API_BASE_URL}${path}`, {
      method, signal: controller.signal,
      headers: { ...(multipart ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data === undefined ? undefined : multipart ? data : JSON.stringify(data),
    })
    const payload = response.status === 204 ? {} : await response.json().catch(() => {
      if (response.ok) throw new Error('The profile service returned an unexpected response. Your draft is saved; please try again.')
      return {}
    })
    if (!response.ok) {
      const error = new Error(typeof payload.message === 'string' ? payload.message : typeof payload.error?.message === 'string' ? payload.error.message : `Profile request failed (${response.status}). Please try again.`)
      error.fieldErrors = payload.errors || payload.fields || payload.details?.fields || payload.error?.fields || payload.error?.details?.fields || payload.error?.errors || {}
      error.status = response.status
      throw error
    }
    return payload
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Your draft is saved; please try again.')
    if (error instanceof TypeError) throw new Error('Unable to connect to the profile service. Your draft is saved. Please try again when the service is available.')
    throw error
  } finally { clearTimeout(timeout) }
}
export const getCandidateProfile = () => request(PROFILE_ENDPOINTS.profile)
export const getCandidateOnboarding = () => request(PROFILE_ENDPOINTS.onboarding)
export const updateCandidateOnboardingStep = (stepKey, status = 'SKIPPED') => request(`${PROFILE_ENDPOINTS.onboardingSteps}/${encodeURIComponent(stepKey)}`, 'PATCH', { status })
export const savePersonalInformation = (data) => request(PROFILE_ENDPOINTS.personal, 'PUT', toPersonalInformationPayload(data))
export const saveProfessionalInformation = (data) => request(PROFILE_ENDPOINTS.professional, 'PUT', toProfessionalPayload(data))
export const saveEducation = (education) => request(PROFILE_ENDPOINTS.education, 'PUT', { education })
export const saveWorkExperience = (workExperience) => request(PROFILE_ENDPOINTS.workExperience, 'PUT', { workExperience: workExperience.map((item) => ({ ...item, employmentType: employmentTypes[item.employmentType] || item.employmentType })) })
const skillName = (skill) => {
  if (typeof skill === 'string') return skill.trim()
  if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return ''
  const name = skill.name ?? skill.skillName ?? skill.skill_name ?? skill.label ?? skill.value
  return typeof name === 'string' ? name.trim() : ''
}
export const saveSkills = (data = {}) => {
  const source = Array.isArray(data) ? data : data.skills
  const skills = Array.isArray(source) ? [...new Set(source.map(skillName).filter(Boolean))] : []
  return request(PROFILE_ENDPOINTS.skills, 'PUT', { skills })
}
export const saveCertifications = (data) => request(PROFILE_ENDPOINTS.certifications, 'PUT', data)
export const saveCareerPreferences = (data) => {
  const payload = {
    ...data,
    employmentTypes: toEmploymentValues(data.employmentTypes),
    workSetting: data.workSetting ? [toPreferenceEnum('workSetting', data.workSetting)] : [],
    shiftPreference: data.shiftPreference ? [toPreferenceEnum('shiftPreference', data.shiftPreference)] : [],
    salaryType: data.salaryType ? toPreferenceEnum('salaryType', data.salaryType) : undefined,
    remotePreference: data.remotePreference ? toPreferenceEnum('remotePreference', data.remotePreference) : undefined,
    availableFrom: typeof data.availableFrom === 'string' ? data.availableFrom.slice(0, 10) || undefined : data.availableFrom,
    expectedSalary: data.expectedSalary === '' || data.expectedSalary == null ? undefined : Number(data.expectedSalary),
  }
  return request(PROFILE_ENDPOINTS.preferences, 'PUT', payload)
}
// Future AI resume parsing integration point: POST a resume file to an extraction service,
// then merge the returned structured fields into the existing candidate profile draft without overwriting user-edited values.
export const uploadResume = (file) => { const data = new FormData(); data.append('resume', file); return request(PROFILE_ENDPOINTS.resume, 'POST', data) }
export const uploadProfilePhoto = (file) => { const data = new FormData(); data.append('photo', file); return request(PROFILE_ENDPOINTS.photo, 'POST', data) }
export const submitCandidateProfile = () => request(PROFILE_ENDPOINTS.submit, 'POST', {})
export const candidateProfileApi = { getCandidateProfile, getCandidateOnboarding, updateCandidateOnboardingStep, savePersonalInformation, saveProfessionalInformation, saveEducation, saveWorkExperience, saveSkills, saveCertifications, saveCareerPreferences, uploadResume, uploadProfilePhoto, submitCandidateProfile }
