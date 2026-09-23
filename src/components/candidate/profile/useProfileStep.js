import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { profilePath } from '../../../lib/candidateProfileOptions'

export default function useProfileStep(section, step, validate) {
  const { profile, updateSection } = useCandidateProfile()
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const update = (name, value) => {
    updateSection(section, (previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validate(profile[section])
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) navigate(profilePath(step + 1))
    else requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
  }
  return { data: profile[section], errors, setErrors, update, submit, updateSection }
}
