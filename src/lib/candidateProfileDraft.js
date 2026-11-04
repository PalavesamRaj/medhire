export const PROFILE_DRAFT_KEY = 'medhire_candidate_profile_draft'
export const emptyProfile = () => ({ personalInformation: {}, professionalInformation: {}, education: [], workExperience: [], skills: [], certifications: [], careerPreferences: {}, resume: null, resumeMetadata: null })
const cleanFields = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item)))
function accountDraftKey() {
  try {
    const user = JSON.parse(localStorage.getItem('medhire_auth_user') || sessionStorage.getItem('medhire_auth_user') || 'null') || {}
    const identity = JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') || {}
    const account = String(user.id || user.userId || user.user_id || user.email || identity.email || '').trim().toLowerCase()
    return account ? `${PROFILE_DRAFT_KEY}:${encodeURIComponent(account)}` : PROFILE_DRAFT_KEY
  } catch { return PROFILE_DRAFT_KEY }
}

export function loadProfileDraft() {
  const profile = emptyProfile()
  try {
    const key = accountDraftKey()
    // Keep a durable, account-scoped browser copy as a fallback when the API
    // is temporarily unavailable or returns an incomplete profile response.
    let saved = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || 'null')
    // Migrate the earlier unscoped draft only when its saved email matches the
    // authenticated candidate. Never reuse one candidate's local draft for another.
    if (!saved && key !== PROFILE_DRAFT_KEY) {
      const legacy = JSON.parse(localStorage.getItem(PROFILE_DRAFT_KEY) || sessionStorage.getItem(PROFILE_DRAFT_KEY) || 'null')
      const user = JSON.parse(localStorage.getItem('medhire_auth_user') || sessionStorage.getItem('medhire_auth_user') || 'null') || {}
      const identity = JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') || {}
      const email = String(user.email || identity.email || '').trim().toLowerCase()
      if (legacy && email && String(legacy.__candidateEmail || '').trim().toLowerCase() === email) saved = legacy
    }
    if (!saved || typeof saved !== 'object') return profile
    for (const key of Object.keys(profile)) {
      if (key === 'resume') continue
      if (Array.isArray(profile[key])) {
        if (Array.isArray(saved[key])) {
          const rows = saved[key].filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(cleanFields)
          profile[key] = key === 'skills' ? rows.filter((item) => typeof item.name === 'string' && item.name.trim()) : rows.map((item, index) => ({ ...item, id: item.id || `restored-${key}-${index}` }))
        }
      } else if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
        profile[key] = cleanFields(saved[key])
        if (key === 'careerPreferences') {
          for (const field of ['preferredSpecialties', 'employmentTypes', 'preferredLocations']) profile[key][field] = Array.isArray(saved[key][field]) ? saved[key][field].filter((item) => typeof item === 'string') : []
        }
      }
    }
  } catch { /* An unavailable or malformed draft must not prevent editing. */ }
  return profile
}

export function saveProfileDraft(profile) {
  try {
    const { resume, ...draft } = profile
    const user = JSON.parse(localStorage.getItem('medhire_auth_user') || sessionStorage.getItem('medhire_auth_user') || 'null') || {}
    const identity = JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') || {}
    const email = String(user.email || identity.email || '').trim().toLowerCase()
    if (email) draft.__candidateEmail = email
    const key = accountDraftKey()
    localStorage.setItem(key, JSON.stringify(draft))
    sessionStorage.removeItem(key)
    if (email) {
      localStorage.removeItem(PROFILE_DRAFT_KEY)
      sessionStorage.removeItem(PROFILE_DRAFT_KEY)
    }
    return true
  } catch { return false }
}

export function clearProfileDraft() {
  try { sessionStorage.removeItem(PROFILE_DRAFT_KEY); return true } catch { return false }
}
