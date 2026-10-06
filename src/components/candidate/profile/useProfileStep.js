import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { PROFILE_SETUP_STEPS, profilePath } from '../../../lib/candidateProfileOptions'
import { candidateProfileApi } from '../../../lib/candidateProfileApi'

export default function useProfileStep(section, step, validate) {
  const { profile, updateSection, saveSection, completeProfile } = useCandidateProfile()
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [operationError, setOperationError] = useState('')
  const navigate = useNavigate()
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
  const finish = async () => {
    await candidateProfileApi.submitCandidateProfile()
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
        if (step === 8) await finish()
        else {
          const value = profile[section]
          const isEmpty = Array.isArray(value) ? value.length === 0 : !value || !Object.values(value).some((item) => item !== '' && item != null && (!Array.isArray(item) || item.length))
          if (!isEmpty) await saveSection(section, value)
          navigate(profilePath(step + 1))
        }
      } catch (error) { applyServerErrors(error) }
      finally { setBusy(false) }
    } else requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
  }
  const skip = async () => {
    if (busy) return
    setBusy(true)
    setOperationError('')
    try {
      if (step === 8) await finish()
      else {
        const current = PROFILE_SETUP_STEPS[step - 1]
        try { await candidateProfileApi.updateCandidateOnboardingStep(progressKey, 'SKIPPED') } catch { /* Skip tracking is optional in the backend contract. */ }
        navigate(current.skipTo || profilePath(step + 1))
      }
    } catch (error) { applyServerErrors(error) }
    finally { setBusy(false) }
  }
  return { data: profile[section], errors, setErrors, update, submit, skip, busy, operationError, updateSection }
}
