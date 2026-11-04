import { getAccessToken } from './authSession.js'
import { authedFetch } from './http'
import { toMonthlySalaryAmount } from './currency'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const PROFILE_ENDPOINTS = {
  onboarding: '/candidates/me/onboarding', onboardingSteps: '/candidates/me/onboarding/steps',
  resume: '/candidates/me/resume', personal: '/candidates/me/personal', professional: '/candidates/me/professional',
  education: '/candidates/me/education', workExperience: '/candidates/me/experience', skills: '/candidates/me/skills',
  certifications: '/candidates/me/certifications', preferences: '/candidates/me/preferences',
  profile: '/candidates/me/profile', photo: '/candidates/me/profile/photo', submit: '/candidates/me/profile/complete',
}
const PHOTO_URL_FIELDS = ['photoUrl', 'photo_url', 'profilePhotoUrl', 'profile_photo_url', 'profileImageUrl', 'profile_image_url', 'avatarUrl', 'avatar_url', 'imageUrl', 'image_url']
const PHOTO_OBJECT_FIELDS = ['profilePhoto', 'profile_photo', 'profileImage', 'profile_image', 'photo', 'avatar', 'image', 'picture']
export function getCandidatePhotoUrl(response) {
  let value = response
  for (let depth = 0; depth < 6 && value && typeof value === 'object'; depth += 1) {
    const directUrl = PHOTO_URL_FIELDS.map((key) => value[key]).find((entry) => typeof entry === 'string' && entry.trim())
    if (directUrl) return directUrl.trim()
    for (const key of PHOTO_OBJECT_FIELDS) {
      const photo = value[key]
      if (typeof photo === 'string' && photo.trim()) return photo.trim()
      if (photo && typeof photo === 'object') {
        const nestedUrl = ['url', 'photoUrl', 'photo_url', 'imageUrl', 'image_url', 'downloadUrl', 'download_url', 'publicUrl', 'public_url', 'path'].map((field) => photo[field]).find((entry) => typeof entry === 'string' && entry.trim())
        if (nestedUrl) return nestedUrl.trim()
      }
    }
    if (typeof value.url === 'string' && value.url.trim()) return value.url.trim()
    value = value.data ?? value.profile ?? value.candidate ?? value.result
  }
  return ''
}
export function getCandidateResumeRecord(response) {
  let value = response
  for (let depth = 0; depth < 7 && value && typeof value === 'object'; depth += 1) {
    if (Array.isArray(value)) {
      value = [...value].sort((left, right) => Number(right?.active === true) - Number(left?.active === true))[0]
      continue
    }
    const rows = value.resumes ?? value.items ?? value.results
    if (Array.isArray(rows)) {
      value = [...rows].sort((left, right) => Number(right?.active === true) - Number(left?.active === true))[0]
      continue
    }
    const nested = value.data ?? value.resume ?? value.resumeMetadata ?? value.resume_metadata ?? value.activeResume ?? value.active_resume
    if (!nested || typeof nested !== 'object') break
    value = nested
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const fileName = value.fileName ?? value.filename ?? value.originalFileName ?? value.original_filename ?? value.name
  const id = value.id ?? value.resumeId ?? value.resume_id ?? value.documentId ?? value.document_id
  if (!fileName && !id) return null
  return {
    ...value,
    ...(id ? { id, resumeId: value.resumeId ?? value.resume_id ?? id } : {}),
    ...(fileName ? { fileName, name: value.name ?? fileName } : {}),
    status: value.status ?? value.approvalStatus ?? value.approval_status ?? 'Uploaded',
  }
}
export async function fetchCandidatePhoto(photoUrl) {
  if (!photoUrl) throw new Error('No profile photo URL is available.')
  const parsedUrl = new URL(photoUrl, window.location.origin)
  const url = parsedUrl.toString()
  const token = getAccessToken()
  const response = await authedFetch(url, {
    headers: { Accept: 'image/*', ...(token && parsedUrl.origin === window.location.origin ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new Error(`Photo request failed (${response.status}).`)
  const blob = await response.blob()
  if (!blob.size || (blob.type && !blob.type.startsWith('image/') && blob.type !== 'application/octet-stream')) {
    throw new Error('The photo URL did not return an image.')
  }
  return URL.createObjectURL(blob)
}
const countryCodes = { 'United States': 'US', India: 'IN', Canada: 'CA', 'United Kingdom': 'GB', Australia: 'AU', Other: 'OTHER' }
export function toPersonalInformationPayload(data = {}) {
  const fields = { ...data }
  delete fields.email
  const payload = {
    ...fields,
    country: countryCodes[fields.country] || fields.country,
  }
  for (const field of ['state', 'zipCode']) if (!String(payload[field] || '').trim()) delete payload[field]
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
export const saveEducation = (education) => request(PROFILE_ENDPOINTS.education, 'PUT', {
  education: education.map((item) => {
    const payload = { ...item }
    delete payload.id
    payload.graduationYear = item.graduationYear === '' || item.graduationYear == null ? undefined : Number(item.graduationYear)
    return payload
  }),
})
export const saveWorkExperience = (workExperience) => request(PROFILE_ENDPOINTS.workExperience, 'PUT', {
  workExperience: workExperience.map((entry) => {
    const item = { ...entry }
    delete item.id
    const normalized = {
      ...item,
      employmentType: employmentTypes[item.employmentType] || item.employmentType,
      startMonth: item.startMonth === '' || item.startMonth == null ? undefined : Number(item.startMonth),
      startYear: item.startYear === '' || item.startYear == null ? undefined : Number(item.startYear),
    }
    if (item.currentlyWorking) {
      delete normalized.endMonth
      delete normalized.endYear
    } else {
      if (item.endMonth === '' || item.endMonth == null) delete normalized.endMonth
      else normalized.endMonth = Number(item.endMonth)
      if (item.endYear === '' || item.endYear == null) delete normalized.endYear
      else normalized.endYear = Number(item.endYear)
    }
    return normalized
  }),
})
const skillName = (skill) => {
  if (typeof skill === 'string') return skill.trim()
  if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return ''
  const name = skill.name ?? skill.skillName ?? skill.skill_name ?? skill.label ?? skill.value
  return typeof name === 'string' ? name.trim() : ''
}
export const saveSkills = async (data = {}) => {
  const source = Array.isArray(data) ? data : data.skills
  const skills = Array.isArray(source) ? [...new Set(source.map(skillName).filter(Boolean))] : []
  const payload = await request(PROFILE_ENDPOINTS.skills, 'PUT', { skills })
  return Array.isArray(payload) ? payload : payload?.data ?? payload
}
export const saveCertifications = (data) => request(PROFILE_ENDPOINTS.certifications, 'PUT', data)
export const saveCareerPreferences = (data) => {
  const payload = {
    ...data,
    employmentTypes: toEmploymentValues(data.employmentTypes),
    workSetting: data.workSetting ? [toPreferenceEnum('workSetting', data.workSetting)] : [],
    shiftPreference: data.shiftPreference ? [toPreferenceEnum('shiftPreference', data.shiftPreference)] : [],
    salaryType: data.expectedSalary !== '' && data.expectedSalary != null ? 'MONTHLY' : undefined,
    remotePreference: data.remotePreference ? toPreferenceEnum('remotePreference', data.remotePreference) : undefined,
    availableFrom: typeof data.availableFrom === 'string' ? data.availableFrom.slice(0, 10) || undefined : data.availableFrom,
    expectedSalary: data.expectedSalary === '' || data.expectedSalary == null ? undefined : toMonthlySalaryAmount(data.expectedSalary, data.salaryType || 'MONTHLY'),
  }
  return request(PROFILE_ENDPOINTS.preferences, 'PUT', payload)
}
// Future AI resume parsing integration point: POST a resume file to an extraction service,
// then merge the returned structured fields into the existing candidate profile draft without overwriting user-edited values.
export const uploadResume = (file) => { const data = new FormData(); data.append('resume', file); return request(PROFILE_ENDPOINTS.resume, 'POST', data) }
export const uploadProfilePhoto = (file) => { const data = new FormData(); data.append('photo', file); return request(PROFILE_ENDPOINTS.photo, 'POST', data) }
export const submitCandidateProfile = () => request(PROFILE_ENDPOINTS.submit, 'POST', {})
export const candidateProfileApi = { getCandidateProfile, getCandidateOnboarding, updateCandidateOnboardingStep, savePersonalInformation, saveProfessionalInformation, saveEducation, saveWorkExperience, saveSkills, saveCertifications, saveCareerPreferences, uploadResume, uploadProfilePhoto, submitCandidateProfile }
