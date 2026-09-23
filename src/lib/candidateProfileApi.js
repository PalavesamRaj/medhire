export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')
export const PROFILE_ENDPOINTS = {
  profile: '/candidate/profile', personal: '/candidate/profile/personal', professional: '/candidate/profile/professional',
  education: '/candidate/profile/education', workExperience: '/candidate/profile/work-experience', skills: '/candidate/profile/skills',
  certifications: '/candidate/profile/certifications', preferences: '/candidate/profile/career-preferences', resume: '/candidate/profile/resume', submit: '/candidate/profile/submit',
}
async function request(path, method = 'GET', data) {
  const multipart = data instanceof FormData
  const token = localStorage.getItem('medhire_access_token')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method, signal: controller.signal,
      headers: { ...(multipart ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data === undefined ? undefined : multipart ? data : JSON.stringify(data),
    })
    const payload = response.status === 204 ? {} : await response.json().catch(() => {
      if (response.ok) throw new Error('The profile service returned an unexpected response. Your draft is saved; please try again.')
      return {}
    })
    if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : typeof payload.error?.message === 'string' ? payload.error.message : `Profile request failed (${response.status}). Please try again.`)
    return payload
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Your draft is saved; please try again.')
    if (error instanceof TypeError) throw new Error('Unable to connect to the profile service. Your draft is saved. Please try again when the service is available.')
    throw error
  } finally { clearTimeout(timeout) }
}
export const getCandidateProfile = () => request(PROFILE_ENDPOINTS.profile)
export const savePersonalInformation = (data) => request(PROFILE_ENDPOINTS.personal, 'PUT', data)
export const saveProfessionalInformation = (data) => request(PROFILE_ENDPOINTS.professional, 'PUT', data)
export const saveEducation = (data) => request(PROFILE_ENDPOINTS.education, 'PUT', data)
export const saveWorkExperience = (data) => request(PROFILE_ENDPOINTS.workExperience, 'PUT', data)
export const saveSkills = (data) => request(PROFILE_ENDPOINTS.skills, 'PUT', data)
export const saveCertifications = (data) => request(PROFILE_ENDPOINTS.certifications, 'PUT', data)
export const saveCareerPreferences = (data) => request(PROFILE_ENDPOINTS.preferences, 'PUT', data)
// Future AI resume parsing integration point: POST a resume file to an extraction service,
// then merge the returned structured fields into the existing candidate profile draft without overwriting user-edited values.
export const uploadResume = (file) => { const data = new FormData(); data.append('resume', file); return request(PROFILE_ENDPOINTS.resume, 'POST', data) }
export const submitCandidateProfile = (profile) => {
  const { resume, ...fields } = profile
  const data = new FormData()
  data.append('profile', JSON.stringify(fields))
  if (resume) data.append('resume', resume)
  return request(PROFILE_ENDPOINTS.submit, 'POST', data)
}
export const candidateProfileApi = { getCandidateProfile, savePersonalInformation, saveProfessionalInformation, saveEducation, saveWorkExperience, saveSkills, saveCertifications, saveCareerPreferences, uploadResume, submitCandidateProfile }
