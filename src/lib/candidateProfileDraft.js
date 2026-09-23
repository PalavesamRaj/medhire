export const PROFILE_DRAFT_KEY = 'medhire_candidate_profile_draft'
export const emptyProfile = () => ({ personalInformation: {}, professionalInformation: {}, education: [], workExperience: [], skills: [], certifications: [], careerPreferences: {}, resume: null })
const cleanFields = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'string' || typeof item === 'boolean'))

export function loadProfileDraft() {
  const profile = emptyProfile()
  try {
    const saved = JSON.parse(sessionStorage.getItem(PROFILE_DRAFT_KEY) || 'null')
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
    sessionStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft))
    return true
  } catch { return false }
}

export function clearProfileDraft() {
  try { sessionStorage.removeItem(PROFILE_DRAFT_KEY); return true } catch { return false }
}
