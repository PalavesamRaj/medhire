import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearProfileDraft, loadProfileDraft, saveProfileDraft } from '../lib/candidateProfileDraft'
import { getAccessToken } from '../lib/authSession'
import { candidateProfileApi } from '../lib/candidateProfileApi'

const CandidateProfileContext = createContext(null)
const unwrap = (response) => response?.data?.profile || response?.data || response?.profile || response || {}
const countryNames = { US: 'United States', IN: 'India', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia', OTHER: 'Other' }
const genderNames = { female: 'Female', male: 'Male', 'non-binary': 'Non-binary', non_binary: 'Non-binary', 'non binary': 'Non-binary', 'prefer not to say': 'Prefer not to say', 'self-describe': 'Self-describe', self_describe: 'Self-describe' }
function normalizeProfile(response) {
  const raw = unwrap(response)
  const personal = raw.personalInformation || raw.personal || {}
  const dateOfBirth = personal.dateOfBirth
  return {
    ...loadProfileDraft(),
    ...raw,
    personalInformation: {
      ...personal,
      country: countryNames[personal.country] || personal.country || '',
      gender: typeof personal.gender === 'string' ? genderNames[personal.gender.toLowerCase()] || personal.gender : personal.gender,
      dateOfBirth: typeof dateOfBirth === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateOfBirth) ? dateOfBirth.slice(0, 10) : dateOfBirth,
    },
    professionalInformation: raw.professionalInformation || raw.professional || {},
    education: raw.education || [],
    workExperience: raw.workExperience || raw.experience || [],
    skills: raw.skills || [],
    certifications: raw.certifications || [],
    careerPreferences: raw.careerPreferences || raw.preferences || {},
    resume: null,
    resumeMetadata: raw.resume || raw.resumeMetadata || null,
    photoUrl: raw.photoUrl || raw.profilePhotoUrl || raw.avatarUrl || '',
  }
}
export function CandidateProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfileDraft)
  const [submitted, setSubmitted] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [loading, setLoading] = useState(Boolean(getAccessToken()))
  const [profileError, setProfileError] = useState('')
  const [candidate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null') } catch { return null }
  })
  useEffect(() => {
    let active = true
    if (!getAccessToken()) { setLoading(false); return () => { active = false } }
    Promise.allSettled([candidateProfileApi.getCandidateProfile(), candidateProfileApi.getCandidateOnboarding()]).then(([profileResult, onboardingResult]) => {
      if (!active) return
      if (profileResult.status === 'fulfilled') setProfile(normalizeProfile(profileResult.value))
      else setProfileError(profileResult.reason?.message || 'Could not load your saved profile.')
      if (onboardingResult.status === 'fulfilled') {
        const progress = unwrap(onboardingResult.value)
        setSubmitted(progress.profileCompleted === true || progress.status === 'COMPLETED')
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const ok = submitted ? clearProfileDraft() : saveProfileDraft(profile)
    setStorageError(ok ? '' : 'Browser storage is unavailable. Keep this tab open to retain your changes.')
  }, [profile, submitted])
  const updateSection = useCallback((section, value) => {
    setSubmitted(false)
    setProfile((previous) => ({ ...previous, [section]: typeof value === 'function' ? value(previous[section]) : value }))
  }, [])
  const completeProfile = () => { clearProfileDraft(); setSubmitted(true) }
  const saveSection = useCallback(async (section, data) => {
    const save = {
      personalInformation: candidateProfileApi.savePersonalInformation,
      professionalInformation: candidateProfileApi.saveProfessionalInformation,
      education: candidateProfileApi.saveEducation,
      workExperience: candidateProfileApi.saveWorkExperience,
      skills: candidateProfileApi.saveSkills,
      certifications: candidateProfileApi.saveCertifications,
      careerPreferences: candidateProfileApi.saveCareerPreferences,
    }[section]
    if (save) await save(data)
  }, [])
  return <CandidateProfileContext.Provider value={{ profile, updateSection, saveSection, submitted, setSubmitted, completeProfile, candidate, storageError, loading, profileError }}>{children}</CandidateProfileContext.Provider>
}
export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext)
  if (!context) throw new Error('useCandidateProfile must be used inside CandidateProfileProvider')
  return context
}
