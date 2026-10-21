import { getAuthenticatedUser } from './authSession'

function getStorageKey() {
  const user = getAuthenticatedUser() || {}
  const recruiterKey = user.userId || user.user_id || user.id || user.email || 'current'
  return `medhire_recruiter_contacted_candidates:${recruiterKey}`
}

function readContactedCandidates() {
  try {
    const value = JSON.parse(localStorage.getItem(getStorageKey()) || '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

export function isCandidateContacted(candidateId) {
  return Boolean(candidateId && readContactedCandidates().includes(String(candidateId)))
}

export function markCandidateContacted(candidateId) {
  if (!candidateId) return
  const ids = new Set(readContactedCandidates())
  ids.add(String(candidateId))
  try { localStorage.setItem(getStorageKey(), JSON.stringify([...ids])) } catch { /* Contact status remains available for the current page session. */ }
}
