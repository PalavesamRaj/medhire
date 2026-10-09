import { getAccessToken } from './authSession.js'
import { authedFetch } from './http'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
// Candidate-owned data is loaded from the authenticated API; the UI does not seed demo records.
export const CANDIDATE_ENDPOINTS = { dashboard: '/candidates/me/dashboard', profile: '/candidates/me/profile', resume: '/candidates/me/resume', resumes: '/candidates/me/resumes', privacy: '/candidates/me/privacy', jobs: '/jobs', applications: '/candidates/me/applications', savedJobs: '/candidates/me/saved-jobs', summary: '/candidates/me/summary' }
async function request(path, method = 'GET', body) {
  const token = getAccessToken()
  const multipart = body instanceof FormData
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await authedFetch(`${API_BASE_URL}${path}`, { method, signal: controller.signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) })
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
export const uploadResume = (file) => { const body = new FormData(); body.append('resume', file); return request(CANDIDATE_ENDPOINTS.resume, 'POST', body) }
export const deleteResume = (id) => request(idPath(CANDIDATE_ENDPOINTS.resumes, id), 'DELETE')
export const getPrivacySettings = () => request(CANDIDATE_ENDPOINTS.privacy)
export const updatePrivacySettings = (data) => request(CANDIDATE_ENDPOINTS.privacy, 'PUT', data)
export const searchJobs = (filters = {}) => request(`${CANDIDATE_ENDPOINTS.jobs}?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value != null && value !== ''))}`)
export const getJobDetails = (id) => request(idPath(CANDIDATE_ENDPOINTS.jobs, id))
export const applyForJob = (id, data) => request(`${idPath(CANDIDATE_ENDPOINTS.jobs, id)}/applications`, 'POST', data)
export const getApplications = () => request(CANDIDATE_ENDPOINTS.applications)
export const getSavedJobs = () => request(CANDIDATE_ENDPOINTS.savedJobs)
export const saveJob = (id) => request(CANDIDATE_ENDPOINTS.savedJobs, 'POST', { jobId: id })
export const removeSavedJob = (id) => request(idPath(CANDIDATE_ENDPOINTS.savedJobs, id), 'DELETE')
export const getCandidateSummary = () => request(CANDIDATE_ENDPOINTS.summary)
export const exportMyData = () => request('/candidates/me/data-export')
export const deleteMyAccount = ({ password }) => request('/candidates/me/account', 'DELETE', { password, confirmation: 'DELETE' })
export const candidateDashboardApi = { exportMyData, deleteMyAccount, getDashboard, getMyProfile, updateProfile, getResume, uploadResume, deleteResume, getPrivacySettings, updatePrivacySettings, searchJobs, getJobDetails, applyForJob, getApplications, getSavedJobs, saveJob, removeSavedJob, getCandidateSummary }
