import { getAccessToken } from './authSession'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export const RECRUITER_ENDPOINTS = {
  dashboard: '/recruiter/dashboard',
  jobs: '/recruiter/jobs',
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

async function request(path, { method = 'GET', body, signal, idempotencyKey } = {}) {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
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
  getJobs: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.jobs, filters)),
  createJob: (body) => request(RECRUITER_ENDPOINTS.jobs, { method: 'POST', body }),
  searchCandidates: (filters = {}) => request(withQuery(RECRUITER_ENDPOINTS.candidates, filters)),
  getCandidate: (candidateId) => request(idPath(RECRUITER_ENDPOINTS.candidates, candidateId)),
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
  getHospitalProfile: () => request(RECRUITER_ENDPOINTS.hospitalProfile),
  updateHospitalProfile: (body) => request(RECRUITER_ENDPOINTS.hospitalProfile, { method: 'PATCH', body }),
}
