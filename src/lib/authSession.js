const ACCESS_TOKEN_KEY = 'medhire_access_token'
const REFRESH_TOKEN_KEY = 'medhire_refresh_token'
const USER_KEY = 'medhire_auth_user'

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

// Saves rotated tokens into whichever storage already holds the session (remember-me aware).
export function storeTokens(tokens) {
  try {
    const storage = localStorage.getItem(ACCESS_TOKEN_KEY) ? localStorage : sessionStorage
    if (tokens.accessToken) storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    if (tokens.refreshToken) storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  } catch { /* storage unavailable */ }
}

export function getAuthenticatedUser() {
  try {
    const serialized = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    return serialized ? JSON.parse(serialized) : null
  } catch {
    return null
  }
}

export function storeAuthSession(response, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage
  for (const currentStorage of [localStorage, sessionStorage]) {
    currentStorage.removeItem(ACCESS_TOKEN_KEY)
    currentStorage.removeItem(REFRESH_TOKEN_KEY)
    currentStorage.removeItem(USER_KEY)
  }
  if (response.accessToken) storage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
  if (response.refreshToken) storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
  if (response.user) storage.setItem(USER_KEY, JSON.stringify(response.user))
}

export function clearAuthSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }
  sessionStorage.removeItem('medhire_candidate_identity')
  sessionStorage.removeItem('medhire_candidate_profile_draft')
}

export function updateAuthenticatedUser(patch) {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const serialized = storage.getItem(USER_KEY)
      if (serialized) storage.setItem(USER_KEY, JSON.stringify({ ...JSON.parse(serialized), ...patch }))
    } catch {
      /* storage unavailable */
    }
  }
}
