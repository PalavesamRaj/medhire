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
    error.fieldErrors = payload?.error?.fields || payload?.fields || {}
    error.status = response.status
    error.code = payload?.error?.code || payload?.code
    throw error
  }
  return payload
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value).trim())
  })
  const suffix = query.toString()
  return suffix ? `${path}?${suffix}` : path
}

const idPath = (base, id) => `${base}/${encodeURIComponent(id)}`

export const recruiterApi = {
  getDashboard: () => request(RECRUITER_ENDPOINTS.dashboard),
  getTeam: () => request('/recruiter/team'),
  inviteTeamMember: (body) => request('/recruiter/team/invitations', { method: 'POST', body }),
  removeTeamMember: (userId) => request(idPath('/recruiter/team', userId), { method: 'DELETE' }),
  getJobs: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.jobs, filters)),
  createJob: (body) => request(RECRUITER_ENDPOINTS.jobs, { method: 'POST', body }),
  updateJob: (jobId, body) => request(idPath(RECRUITER_ENDPOINTS.jobs, jobId), { method: 'PATCH', body }),
  closeJob: (jobId) => request(`${idPath(RECRUITER_ENDPOINTS.jobs, jobId)}/close`, { method: 'POST', body: {} }),
  getJobApplications: (jobId, filters = {}) => request(withQuery(`${idPath(RECRUITER_ENDPOINTS.jobs, jobId)}/applications`, filters)),
  getApplication: (applicationId) => request(idPath(RECRUITER_ENDPOINTS.applications, applicationId)),
  updateApplicationStatus: (applicationId, status) => request(`${idPath(RECRUITER_ENDPOINTS.applications, applicationId)}/status`, { method: 'PATCH', body: { status } }),
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
  uploadOrganizationDocument: (file, type) => { const body = new FormData(); body.append('type', type); body.append('document', file); return request('/recruiter/organization/documents', { method: 'POST', body }) },
  deleteOrganizationDocument: (documentId) => request(`/recruiter/organization/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' }),
  getHospitalProfile: () => request(RECRUITER_ENDPOINTS.hospitalProfile),
  updateHospitalProfile: (body) => request(RECRUITER_ENDPOINTS.hospitalProfile, { method: 'PATCH', body }),
}
