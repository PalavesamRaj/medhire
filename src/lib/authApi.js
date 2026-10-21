import { getAccessToken } from './authSession'
import { authedFetch } from './http'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

function getErrorMessage(payload, fallback) {
  if (payload?.error?.message) return payload.error.message
  if (typeof payload?.message === 'string') return payload.message
  return fallback
}

// The backend returns some auth DTOs at the root and others inside `data`.
// Flatten the success envelope once so every screen consumes the same shape.
function normalizeAuthResponse(payload) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {}
  return { ...payload, ...data, user: payload?.user ?? data.user }
}

async function request(path, options = {}) {
  const token = getAccessToken()
  const response = await authedFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const raw = await response.json().catch(() => ({}))
  const payload = response.ok ? normalizeAuthResponse(raw) : raw
  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, 'Something went wrong. Please try again.'))
    error.fieldErrors = payload?.error?.fields || payload?.error?.details?.fields || payload?.fields || payload?.details?.fields || {}
    error.status = response.status
    error.code = payload?.error?.code || payload?.code
    throw error
  }

  return payload
}

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body }),
  verifyCode: (body) => request('/auth/verify-code', { method: 'POST', body }),
  resendCode: (body) => request('/auth/resend-code', { method: 'POST', body }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
  changePassword: (body) => request('/auth/change-password', { method: 'PATCH', body }),
  changeEmail: (body) => request('/auth/change-email', { method: 'POST', body }),
  confirmEmailChange: (token) => request('/auth/change-email/confirm', { method: 'POST', body: { token } }),
  getInvitationPreview: (token) => request(`/auth/invitations/${encodeURIComponent(token)}`),
  acceptInvitation: (body) => request('/auth/accept-invite', { method: 'POST', body }),
  me: () => request('/auth/me'),
}
