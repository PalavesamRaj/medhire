export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')
// Future backend contract. The UI deliberately uses the separate mock context today.
export const CANDIDATE_ENDPOINTS = { dashboard: '/candidate/dashboard', profile: '/candidate/profile', resumes: '/candidate/resumes', privacy: '/candidate/privacy-settings', jobs: '/jobs', applications: '/candidate/applications', savedJobs: '/candidate/saved-jobs', summary: '/candidate/summary' }
async function request(path, method = 'GET', body) {
  const token = localStorage.getItem('medhire_access_token')
  const multipart = body instanceof FormData
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { method, signal: controller.signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) })
    if (response.status === 204) return null
    const payload = await response.json().catch(() => { throw new Error('The candidate service returned an unexpected response.') })
    if (!response.ok) throw new Error(payload.message || payload.error?.message || 'Unable to complete your request.')
    return payload
  } finally { clearTimeout(timer) }
}
const idPath = (base, id) => `${base}/${encodeURIComponent(id)}`
export const getDashboard = () => request(CANDIDATE_ENDPOINTS.dashboard)
export const getMyProfile = () => request(CANDIDATE_ENDPOINTS.profile)
export const updateProfile = (data) => request(CANDIDATE_ENDPOINTS.profile, 'PATCH', data)
export const getResume = () => request(CANDIDATE_ENDPOINTS.resumes)
export const uploadResume = (file) => { const body = new FormData(); body.append('resume', file); return request(CANDIDATE_ENDPOINTS.resumes, 'POST', body) }
export const deleteResume = (id) => request(idPath(CANDIDATE_ENDPOINTS.resumes, id), 'DELETE')
export const getPrivacySettings = () => request(CANDIDATE_ENDPOINTS.privacy)
export const updatePrivacySettings = (data) => request(CANDIDATE_ENDPOINTS.privacy, 'PUT', data)
export const searchJobs = (filters = {}) => request(`${CANDIDATE_ENDPOINTS.jobs}?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value != null && value !== ''))}`)
export const getJobDetails = (id) => request(idPath(CANDIDATE_ENDPOINTS.jobs, id))
export const applyForJob = (id, data) => request(`${idPath(CANDIDATE_ENDPOINTS.jobs, id)}/apply`, 'POST', data)
export const getApplications = () => request(CANDIDATE_ENDPOINTS.applications)
export const getSavedJobs = () => request(CANDIDATE_ENDPOINTS.savedJobs)
export const saveJob = (id) => request(idPath(CANDIDATE_ENDPOINTS.savedJobs, id), 'PUT')
export const removeSavedJob = (id) => request(idPath(CANDIDATE_ENDPOINTS.savedJobs, id), 'DELETE')
export const getCandidateSummary = () => request(CANDIDATE_ENDPOINTS.summary)
export const candidateDashboardApi = { getDashboard, getMyProfile, updateProfile, getResume, uploadResume, deleteResume, getPrivacySettings, updatePrivacySettings, searchJobs, getJobDetails, applyForJob, getApplications, getSavedJobs, saveJob, removeSavedJob, getCandidateSummary }
