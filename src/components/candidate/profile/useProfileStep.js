import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { PROFILE_SETUP_STEPS, profilePath } from '../../../lib/candidateProfileOptions'
import { candidateProfileApi } from '../../../lib/candidateProfileApi'

export default function useProfileStep(section, step, validate) {
  const { profile, updateSection, saveSection, completeProfile } = useCandidateProfile()
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [operationError, setOperationError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo
  const progressKey = { personalInformation: 'personal', professionalInformation: 'professional', workExperience: 'experience', careerPreferences: 'preferences' }[section] || section
  const applyServerErrors = (error) => {
    const fieldErrors = error.fieldErrors && typeof error.fieldErrors === 'object' ? error.fieldErrors : {}
    const mapped = Object.fromEntries(Object.entries(fieldErrors).map(([field, message]) => {
      const name = field.split('.').at(-1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      return [name, Array.isArray(message) ? message.join(' ') : typeof message === 'string' ? message : message?.message || 'Check this value.']
    }))
    if (Object.keys(mapped).length) {
      setErrors((previous) => ({ ...previous, ...mapped }))
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
    }
    setOperationError(error.message || 'Could not save your profile. Please try again.')
  }
  const update = (name, value) => {
    updateSection(section, (previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  const ensureOptionalStepsResolved = async () => {
    let response
    try { response = await candidateProfileApi.getCandidateOnboarding() } catch { return }
    const onboarding = response?.data?.onboarding || response?.data || response?.onboarding || response || {}
    const steps = onboarding.steps ?? onboarding.onboarding?.steps
    if (!steps) return
    const records = Array.isArray(steps)
      ? steps.map((item) => [item?.stepKey ?? item?.key ?? item?.step ?? item?.name, item])
      : Object.entries(steps)
    const keyAliases = {
      personalinformation: 'personal', personal: 'personal',
      professionalinformation: 'professional', professional: 'professional',
      education: 'education', workexperience: 'experience', experience: 'experience',
      skills: 'skills', skill: 'skills', certifications: 'certifications', certification: 'certifications',
      careerpreferences: 'preferences', preferences: 'preferences', preference: 'preferences',
    }
    const statusByKey = new Map(records.map(([rawKey, item]) => {
      const key = keyAliases[String(rawKey ?? '').toLowerCase().replace(/[^a-z]/g, '')]
      const status = typeof item === 'string' ? item : item?.status ?? item?.stepStatus ?? item?.step_status
      return [key, String(status || '').toUpperCase()]
    }).filter(([key]) => key))
    const requiredKeys = ['personal', 'professional', 'education', 'experience', 'skills', 'certifications', 'preferences']
    for (const key of requiredKeys) {
      const status = statusByKey.get(key)
      if (status !== 'COMPLETED' && status !== 'SKIPPED') await candidateProfileApi.updateCandidateOnboardingStep(key, 'SKIPPED')
    }
  }
  const skipRemainingProfileSteps = async () => {
    for (const key of ['personal', 'professional', 'education', 'experience', 'skills', 'certifications', 'preferences']) {
      await candidateProfileApi.updateCandidateOnboardingStep(key, 'SKIPPED')
    }
  }
  const finish = async () => {
    await ensureOptionalStepsResolved()
    try {
      await candidateProfileApi.submitCandidateProfile()
    } catch (error) {
      if (error.status !== 422) throw error
      await skipRemainingProfileSteps()
      await candidateProfileApi.submitCandidateProfile()
    }
    completeProfile()
    navigate(profilePath(9))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const nextErrors = validate(profile[section])
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) {
      setOperationError('')
      setBusy(true)
      try {
        const value = profile[section]
        const isEmpty = Array.isArray(value) ? value.length === 0 : !value || !Object.values(value).some((item) => item !== '' && item != null && (!Array.isArray(item) || item.length))
        if (!isEmpty) await saveSection(section, value)
        if (returnTo) navigate(returnTo)
        else if (step === 8) await finish()
        else navigate(profilePath(step + 1))
      } catch (error) { applyServerErrors(error) }
      finally { setBusy(false) }
    } else requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
  }
  const skip = async () => {
    if (busy) return
    if (returnTo) { navigate(returnTo); return }
    setBusy(true)
    setOperationError('')
    try {
      const current = PROFILE_SETUP_STEPS[step - 1]
      if (progressKey !== 'resume') await candidateProfileApi.updateCandidateOnboardingStep(progressKey, 'SKIPPED')
      if (step === 8) await finish()
      else navigate(current.skipTo || profilePath(step + 1))
    } catch (error) { applyServerErrors(error) }
    finally { setBusy(false) }
  }
  return { data: profile[section], errors, setErrors, update, submit, skip, busy, operationError, updateSection }
}
