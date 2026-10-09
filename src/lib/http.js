// Central HTTP helpers: silent token refresh on 401, one retry, and a real logout.
import { getAccessToken, getRefreshToken, getAuthenticatedUser, storeTokens, clearAuthSession } from './authSession'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const PUBLIC_AUTH_PATH = /\/auth\/(login|register|forgot-password|verify-code|resend-code|reset-password|refresh)(\?|$)/

let refreshInFlight = null

// One refresh at a time: parallel requests that all get 401 share the same refresh call.
export function refreshSession() {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken()
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // lets the backend use an HTTP-only refresh cookie instead of a stored token
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    })
    if (!response.ok) throw new Error('Session refresh failed')
    const data = await response.json()
    if (!data?.accessToken) throw new Error('Session refresh returned no token')
    storeTokens(data)
    return data.accessToken
  })().finally(() => { refreshInFlight = null })
  return refreshInFlight
}

export function endSessionAndRedirect() {
  const role = String(getAuthenticatedUser()?.role || '').toLowerCase()
  clearAuthSession()
  window.location.assign(`/login?role=${role === 'recruiter' ? 'recruiter' : 'candidate'}&expired=1`)
}

// Drop-in replacement for fetch() on authenticated API calls.
export async function authedFetch(url, init = {}) {
  const response = await fetch(url, init)
  const sentToken = init.headers?.Authorization || init.headers?.authorization
  if (response.status !== 401 || !sentToken || PUBLIC_AUTH_PATH.test(String(url))) return response
  try {
    const token = await refreshSession()
    return await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } })
  } catch {
    endSessionAndRedirect()
    return response
  }
}

// Server-side logout (revokes the refresh token), then clear the browser session.
export async function logout() {
  const token = getAccessToken()
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ refreshToken: getRefreshToken() || undefined }),
    })
  } catch { /* offline: still sign out locally */ }
  clearAuthSession()
}
