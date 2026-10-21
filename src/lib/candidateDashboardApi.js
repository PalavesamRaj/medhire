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
    if (!response.ok) {
      const error = new Error(payload.message || payload.error?.message || 'Unable to complete your request.')
      error.fieldErrors = payload.error?.fields || payload.error?.details?.fields || payload.fields || payload.details?.fields || {}
      error.code = payload.error?.code
      error.status = response.status
      throw error
    }
    return payload
  } finally { clearTimeout(timer) }
}
const idPath = (base, id) => `${base}/${encodeURIComponent(id)}`
async function requestAllPages(path, filters = {}) {
  const items = []
  let page = 1
  let pageSize = 100
  let totalPages = 1
  let pagination = {}
  let envelope = {}
  do {
    const query = new URLSearchParams(Object.entries({ ...filters, page, pageSize }).filter(([, value]) => value != null && value !== ''))
    const payload = await request(`${path}?${query}`)
    envelope = payload?.data ?? payload
    const rows = Array.isArray(envelope) ? envelope : envelope?.items || envelope?.results || envelope?.jobs || envelope?.applications || envelope?.savedJobs || []
    if (!Array.isArray(rows)) throw new Error('The candidate service returned an invalid list response.')
    items.push(...rows)
    pagination = payload?.pagination || envelope?.pagination || pagination
    totalPages = Number(pagination.totalPages) || (rows.length === pageSize ? page + 1 : page)
    page += 1
    if (page > 1000) throw new Error('The candidate list exceeded the pagination safety limit.')
  } while (page <= totalPages)
  return { data: items, pagination: { ...pagination, page: 1, pageSize, total: Number(pagination.total) || items.length, totalPages: Math.max(1, totalPages) } }
}
export const getDashboard = () => request(CANDIDATE_ENDPOINTS.dashboard)
export const getMyProfile = () => request(CANDIDATE_ENDPOINTS.profile)
export const updateProfile = ({ firstName, lastName, headline, location, summary, ...sections } = {}) => request(CANDIDATE_ENDPOINTS.profile, 'PATCH', {
  ...sections,
  ...(firstName !== undefined || lastName !== undefined || location !== undefined ? { personal: { ...(firstName !== undefined ? { firstName } : {}), ...(lastName !== undefined ? { lastName } : {}), ...(location !== undefined ? { city: location } : {}) } } : {}),
  ...(headline !== undefined || summary !== undefined ? { professional: { ...(headline !== undefined ? { currentJobTitle: headline } : {}), ...(summary !== undefined ? { professionalSummary: summary } : {}) } } : {}),
})
export const getResume = () => request(CANDIDATE_ENDPOINTS.resumes)
export const uploadResume = (file) => { const body = new FormData(); body.append('resume', file); return request(CANDIDATE_ENDPOINTS.resume, 'POST', body) }
export const deleteResume = (id) => request(idPath(CANDIDATE_ENDPOINTS.resumes, id), 'DELETE')
export async function downloadResume(id) {
  const token = getAccessToken()
  const path = `${idPath(CANDIDATE_ENDPOINTS.resumes, id)}/download`
  const response = await authedFetch(`${API_BASE_URL}${path}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = new Error(payload?.error?.message || payload?.message || 'Unable to download this resume.')
    error.status = response.status
    throw error
  }
  return response.blob()
}
export const getPrivacySettings = () => request(CANDIDATE_ENDPOINTS.privacy)
export const updatePrivacySettings = (data) => request(CANDIDATE_ENDPOINTS.privacy, 'PUT', data)
export const searchJobs = (filters = {}) => {
  const { hospital, type, ...supported } = filters
  const query = { ...supported }
  // The deployed API supports q/location/specialty/employmentType/workSetting.
  // Hospital and type are UI names; map them to the supported search fields.
  if (hospital) query.q = [query.q, hospital].filter(Boolean).join(' ')
  if (type && type !== 'All') query.employmentType = String(type).replaceAll(' ', '_').toUpperCase()
  return requestAllPages(CANDIDATE_ENDPOINTS.jobs, query)
}
export const getJobDetails = (id) => request(idPath(CANDIDATE_ENDPOINTS.jobs, id))
export const applyForJob = (id, data) => request(`${idPath(CANDIDATE_ENDPOINTS.jobs, id)}/applications`, 'POST', data)
export const getApplications = () => requestAllPages(CANDIDATE_ENDPOINTS.applications)
export const getSavedJobs = () => requestAllPages(CANDIDATE_ENDPOINTS.savedJobs)
export const saveJob = (id) => request(CANDIDATE_ENDPOINTS.savedJobs, 'POST', { jobId: id })
export const removeSavedJob = (id) => request(idPath(CANDIDATE_ENDPOINTS.savedJobs, id), 'DELETE')
export const getCandidateSummary = () => request(CANDIDATE_ENDPOINTS.summary)
export const exportMyData = () => request('/candidates/me/data-export')
export const deleteMyAccount = ({ reason } = {}) => request('/candidates/me/account', 'DELETE', reason ? { reason } : undefined)
export const candidateDashboardApi = { exportMyData, deleteMyAccount, getDashboard, getMyProfile, updateProfile, getResume, uploadResume, deleteResume, downloadResume, getPrivacySettings, updatePrivacySettings, searchJobs, getJobDetails, applyForJob, getApplications, getSavedJobs, saveJob, removeSavedJob, getCandidateSummary }
