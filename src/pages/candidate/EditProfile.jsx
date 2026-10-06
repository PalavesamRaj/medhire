import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import ProfileField from '../../components/candidate/profile/ProfileField'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'
import { validateEditProfile } from '../../lib/candidateDashboardValidation'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import { getCandidateProfileCompletion } from '../../lib/candidateProfileCompletion'
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'
import { Link } from 'react-router-dom'

export default function EditProfile() {
  const { profile } = useCandidateProfile()
  const { candidate, dispatch } = useCandidateDashboard()
  const [form, setForm] = useState(() => Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key]])))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const update = (name, value) => { setForm((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: undefined })) }
  const sections = getCandidateProfileCompletion(profile).sections
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateEditProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    setBusy(true)
    setError('')
    const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    try {
      await candidateDashboardApi.updateProfile(data)
      dispatch({ type: 'edit', data })
      toast('Profile changes saved.')
      navigate('/candidate/profile')
    } catch (requestError) { setError(requestError.message || 'Unable to save your profile changes.') }
    finally { setBusy(false) }
  }
  return <><PageHeading title="Edit Profile" subtitle="Update your profile summary" /><form noValidate onSubmit={submit} className="med-card space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[['firstName', 'First Name'], ['lastName', 'Last Name'], ['headline', 'Headline'], ['location', 'Location'], ['summary', 'Summary']].map(([name, label], index) => <ProfileField key={name} name={name} label={label} type={name === 'summary' ? 'textarea' : 'text'} wide={index > 1} value={form[name]} error={errors[name]} onChange={(value) => update(name, value)} />)}</div>
    <section className="border-t border-ink-200 pt-5"><h2 className="med-heading-3">Complete your profile sections</h2><p className="med-caption mt-1 text-ink-600">Open a section to add missing information or update what you have already provided.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{sections.map((section) => <li key={section.key}><Link to={section.path} className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 text-sm hover:border-brand-600 hover:bg-brand-50"><span>{section.label}</span><span className={section.complete ? 'text-green-700' : 'text-brand-600'}>{section.complete ? 'Complete' : section.optional ? 'Optional · Add' : 'Add details'} →</span></Link></li>)}</ul></section>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-3"><Button variant="secondary" type="button" disabled={busy} onClick={() => navigate('/candidate/profile')}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</Button></div></form></>
}
