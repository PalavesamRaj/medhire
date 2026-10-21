import { getAccessToken } from './authSession'
import { authedFetch } from './http'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export const RECRUITER_ENDPOINTS = {
  dashboard: '/recruiter/dashboard',
  jobs: '/recruiter/jobs',
  applications: '/recruiter/applications',
  candidates: '/recruiter/candidates',
  purchasedCandidates: '/recruiter/purchased-candidates',
  shortlistedCandidates: '/recruiter/shortlisted-candidates',
  plans: '/recruiter/plans',
  credits: '/recruiter/credits',
  checkout: '/recruiter/checkout',
  paymentHistory: '/recruiter/payment-history',
  hospitalProfile: '/recruiter/hospital-profile',
}

function getErrorMessage(payload, fallback) {
  if (payload?.error?.message) return payload.error.message
  if (typeof payload?.message === 'string') return payload.message
  return fallback
}

export async function request(path, { method = 'GET', body, signal, idempotencyKey } = {}) {
  const token = getAccessToken()
  const response = await authedFetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, 'Unable to complete the recruiter request. Please try again.'))
    error.fieldErrors = payload?.error?.fields || payload?.error?.details?.fields || payload?.fields || payload?.details?.fields || {}
    error.details = payload?.error?.details || payload?.details
    error.requestId = payload?.error?.requestId || payload?.requestId
    error.status = response.status
    error.code = payload?.error?.code || payload?.code
    throw error
  }
  return payload
}

export async function downloadCandidateResume(candidateId, resumeId) {
  const token = getAccessToken()
  const path = `/recruiter/candidates/${encodeURIComponent(candidateId)}/resumes/${encodeURIComponent(resumeId)}/download`
  const response = await authedFetch(`${API_BASE_URL}${path}`, { headers: { Accept: '*/*', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = new Error(getErrorMessage(payload, 'Unable to download this resume.'))
    error.status = response.status
    throw error
  }
  return response.blob()
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value).trim())
  })
  const suffix = query.toString()
  return suffix ? `${path}?${suffix}` : path
}

async function requestAllPages(path, filters = {}) {
  const items = []
  let page = 1
  const pageSize = 100
  let totalPages = 1
  let firstPayload = null
  let pagination = {}
  do {
    const payload = await request(withQuery(path, { ...filters, page, pageSize }))
    if (!firstPayload) firstPayload = payload
    const envelope = payload?.data ?? payload
    const rows = Array.isArray(envelope) ? envelope : envelope?.items || envelope?.results || envelope?.jobs || envelope?.applications || []
    if (!Array.isArray(rows)) throw new Error(`The ${path} response did not contain a list.`)
    items.push(...rows)
    pagination = payload?.pagination || envelope?.pagination || pagination
    totalPages = Number(pagination.totalPages) || (rows.length === pageSize ? page + 1 : page)
    page += 1
    if (page > 1000) throw new Error(`The ${path} response exceeded the pagination safety limit.`)
  } while (page <= totalPages)
  return { ...(firstPayload || {}), data: items, pagination: { ...pagination, page: 1, pageSize, total: Number(pagination.total) || items.length, totalPages: Math.max(1, totalPages) } }
}

const idPath = (base, id) => `${base}/${encodeURIComponent(id)}`
const employmentTypeValue = (value) => ({ 'FULL-TIME': 'FULL_TIME', 'FULL TIME': 'FULL_TIME', 'PART-TIME': 'PART_TIME', 'PART TIME': 'PART_TIME', 'PER DIEM': 'PER_DIEM' }[String(value || '').trim().toUpperCase()] || String(value || '').trim().toUpperCase().replaceAll(' ', '_'))
function toJobPayload(body = {}) {
  const { salaryRange, requirements, ...fields } = body
  const salary = String(salaryRange || '')
  const values = salary.match(/\d+(?:,\d{3})*(?:\.\d+)?/g)?.map((part) => Number(part.replaceAll(',', ''))) || []
  const multiplier = /\blakh\b/i.test(salary) ? 100000 : /\bk\b/i.test(salary) ? 1000 : 1
  const payload = { ...fields, employmentType: employmentTypeValue(fields.employmentType), workSetting: fields.workSetting || 'ONSITE' }
  if (values.length) {
    payload.salaryMin = values[0] * multiplier
    if (values.length > 1) payload.salaryMax = values[1] * multiplier
  }
  const requirementLines = Array.isArray(requirements) ? requirements.filter(Boolean) : []
  if (requirementLines.length) payload.description = `${fields.description || ''}\n\nRequirements:\n${requirementLines.map((item) => `- ${item}`).join('\n')}`
  return payload
}

export const recruiterApi = {
  downloadCandidateResume,
  getDashboard: () => request(RECRUITER_ENDPOINTS.dashboard),
  getTeam: () => request('/recruiter/team'),
  inviteTeamMember: (body) => request('/recruiter/team/invitations', { method: 'POST', body }),
  removeTeamMember: (userId) => request(idPath('/recruiter/team', userId), { method: 'DELETE' }),
  getJobs: (filters = {}) => requestAllPages(RECRUITER_ENDPOINTS.jobs, filters),
  createJob: (body) => request(RECRUITER_ENDPOINTS.jobs, { method: 'POST', body: toJobPayload(body) }),
  updateJob: (jobId, body) => request(idPath(RECRUITER_ENDPOINTS.jobs, jobId), { method: 'PATCH', body: toJobPayload(body) }),
  closeJob: (jobId) => request(`${idPath(RECRUITER_ENDPOINTS.jobs, jobId)}/close`, { method: 'POST', body: {} }),
  getJobApplications: (jobId, filters = {}) => requestAllPages(`${idPath(RECRUITER_ENDPOINTS.jobs, jobId)}/applications`, filters),
  getApplication: (applicationId) => request(idPath(RECRUITER_ENDPOINTS.applications, applicationId)),
  updateApplicationStatus: (applicationId, status, reason) => {
    const actionByStatus = { UNDER_REVIEW: 'review', SHORTLISTED: 'shortlist', INTERVIEW: 'interview', HIRED: 'hire', REJECTED: 'reject' }
    const action = actionByStatus[String(status).trim().toUpperCase().replaceAll(' ', '_')]
    if (!action) throw new Error(`Unsupported application status: ${status}`)
    return request(`${idPath(RECRUITER_ENDPOINTS.applications, applicationId)}/${action}`, { method: 'POST', body: reason ? { reason } : {} })
  },
  resubmitOrganization: (message = '') => request('/recruiter/organization/resubmit', { method: 'POST', body: { message } }),
  searchCandidates: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.candidates, filters)),
  getCandidate: (publicId) => request(idPath(RECRUITER_ENDPOINTS.candidates, publicId)),
  unlockCandidate: (candidateId, idempotencyKey) => request(`${idPath(RECRUITER_ENDPOINTS.candidates, candidateId)}/unlock`, { method: 'POST', body: {}, idempotencyKey }),
  getPurchasedCandidates: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.purchasedCandidates, filters)),
  getShortlistedCandidates: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.shortlistedCandidates, filters)),
  addShortlistedCandidate: (candidateId) => request(RECRUITER_ENDPOINTS.shortlistedCandidates, { method: 'POST', body: { candidateId } }),
  removeShortlistedCandidate: (candidateId) => request(idPath(RECRUITER_ENDPOINTS.shortlistedCandidates, candidateId), { method: 'DELETE' }),
  getPlans: () => request(RECRUITER_ENDPOINTS.plans),
  getCreditBalance: () => request(RECRUITER_ENDPOINTS.credits),
  createCheckout: (body) => request(RECRUITER_ENDPOINTS.checkout, { method: 'POST', body }),
  getCheckoutSession: (sessionId) => request(`${idPath(RECRUITER_ENDPOINTS.checkout, sessionId)}`),
  getPaymentHistory: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.paymentHistory, filters)),
  getInvoice: (transactionId) => request(`${idPath(RECRUITER_ENDPOINTS.paymentHistory, transactionId)}/invoice`),
  getOrganizationDocuments: () => request('/recruiter/organization/documents'),
  uploadOrganizationDocument: (file, documentType) => { const body = new FormData(); body.append('documentType', documentType); body.append('document', file); return request('/recruiter/organization/documents', { method: 'POST', body }) },
  deleteOrganizationDocument: (documentId) => request(`/recruiter/organization/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' }),
  getHospitalProfile: () => request(RECRUITER_ENDPOINTS.hospitalProfile),
  updateHospitalProfile: (body) => request(RECRUITER_ENDPOINTS.hospitalProfile, { method: 'PATCH', body }),
}
