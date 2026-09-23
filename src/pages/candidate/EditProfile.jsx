import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import ProfileField from '../../components/candidate/profile/ProfileField'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'
import { validateEditProfile } from '../../lib/candidateDashboardValidation'

export default function EditProfile() {
  const { candidate, dispatch } = useCandidateDashboard()
  const [form, setForm] = useState(() => Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key]])))
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const toast = useToast()
  const update = (name, value) => { setForm((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: undefined })) }
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateEditProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    dispatch({ type: 'edit', data: Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) })
    toast('Profile changes saved for this session.')
    navigate('/candidate/profile')
  }
  return <><PageHeading title="Edit Profile" subtitle="Update your profile summary" /><form noValidate onSubmit={submit} className="med-card space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[['firstName', 'First Name'], ['lastName', 'Last Name'], ['headline', 'Headline'], ['location', 'Location'], ['summary', 'Summary']].map(([name, label], index) => <ProfileField key={name} name={name} label={label} type={name === 'summary' ? 'textarea' : 'text'} wide={index > 1} value={form[name]} error={errors[name]} onChange={(value) => update(name, value)} />)}</div><p className="med-caption text-ink-400">Education, Work Experience, Skills, Certifications, and Career Preferences are managed in their dedicated profile setup sections.</p><div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => navigate('/candidate/profile')}>Cancel</Button><Button type="submit">Save Changes</Button></div></form></>
}
