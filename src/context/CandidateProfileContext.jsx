import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearProfileDraft, loadProfileDraft, saveProfileDraft } from '../lib/candidateProfileDraft'

const CandidateProfileContext = createContext(null)
export function CandidateProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfileDraft)
  const [submitted, setSubmitted] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [candidate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') } catch { return null }
  })
  useEffect(() => {
    const ok = submitted ? clearProfileDraft() : saveProfileDraft(profile)
    setStorageError(ok ? '' : 'Browser storage is unavailable. Keep this tab open to retain your changes.')
  }, [profile, submitted])
  const updateSection = useCallback((section, value) => {
    setSubmitted(false)
    setProfile((previous) => ({ ...previous, [section]: typeof value === 'function' ? value(previous[section]) : value }))
  }, [])
  const completeProfile = () => { clearProfileDraft(); setSubmitted(true) }
  return <CandidateProfileContext.Provider value={{ profile, updateSection, submitted, completeProfile, candidate, storageError }}>{children}</CandidateProfileContext.Provider>
}
export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext)
  if (!context) throw new Error('useCandidateProfile must be used inside CandidateProfileProvider')
  return context
}
