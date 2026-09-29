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
}
