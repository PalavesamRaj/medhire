import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import ProfileField from '../../components/candidate/profile/ProfileField'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'
import { validateEditProfile } from '../../lib/candidateDashboardValidation'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import { getCandidateProfileCompletion } from '../../lib/candidateProfileCompletion'
import { candidateProfileApi } from '../../lib/candidateProfileApi'
import { Link } from 'react-router-dom'

export default function EditProfile() {
  const { profile, loading: profileLoading, updateSection } = useCandidateProfile()
  const { candidate, dispatch } = useCandidateDashboard()
  const [form, setForm] = useState(() => Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key]])))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  useEffect(() => {
    if (profileLoading) return
    setForm(Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key] || ''])))
  }, [profileLoading, candidate.firstName, candidate.lastName, candidate.headline, candidate.location, candidate.summary])
  const update = (name, value) => { setForm((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: undefined })) }
  const completion = getCandidateProfileCompletion(profile)
  const sections = completion.sections
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateEditProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    setBusy(true)
    setError('')
    const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    try {
      const [cityValue = '', ...stateParts] = data.location.split(',')
      const personalInformation = { ...profile.personalInformation, firstName: data.firstName, lastName: data.lastName, city: cityValue.trim(), state: stateParts.join(',').trim() }
      const professionalInformation = { ...profile.professionalInformation, currentJobTitle: data.headline, professionalSummary: data.summary }
      await Promise.all([
        candidateProfileApi.savePersonalInformation(personalInformation),
        candidateProfileApi.saveProfessionalInformation(professionalInformation),
      ])
      updateSection('personalInformation', personalInformation)
      updateSection('professionalInformation', professionalInformation)
      dispatch({ type: 'edit', data })
      toast('Profile changes saved.')
      navigate('/candidate/profile')
    } catch (requestError) { setError(requestError.message || 'Unable to save your profile changes.') }
    finally { setBusy(false) }
  }
  if (profileLoading) return <><PageHeading title="Edit Profile" subtitle="Loading your saved profile…" /><div className="med-card" role="status">Loading saved profile and completion…</div></>
  return <><PageHeading title="Edit Profile" subtitle="Update your profile summary" /><div className="med-card mb-4"><div className="flex items-center justify-between gap-3"><h2 className="med-heading-3">Profile completion</h2><span className="med-body font-semibold text-brand-600">{completion.percentage}%</span></div><div role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage} className="mt-3 h-2.5 rounded-full bg-brand-50"><div style={{ width: `${completion.percentage}%` }} className="h-full rounded-full bg-green-600" /></div></div><form noValidate onSubmit={submit} className="med-card space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[['firstName', 'First Name'], ['lastName', 'Last Name'], ['headline', 'Headline'], ['location', 'Location'], ['summary', 'Summary']].map(([name, label], index) => <ProfileField key={name} name={name} label={label} type={name === 'summary' ? 'textarea' : 'text'} wide={index > 1} value={form[name]} error={errors[name]} onChange={(value) => update(name, value)} />)}</div>
    <section className="border-t border-ink-200 pt-5"><h2 className="med-heading-3">Complete your profile sections</h2><p className="med-caption mt-1 text-ink-600">Open a section to add missing information or update what you have already provided.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{sections.map((section) => <li key={section.key}><Link to={section.path} state={{ returnTo: '/candidate/edit-profile' }} className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 text-sm hover:border-brand-600 hover:bg-brand-50"><span>{section.label}</span><span className={section.complete ? 'text-green-700' : 'text-brand-600'}>{section.complete ? 'Complete' : section.optional ? 'Optional · Add' : 'Add details'} →</span></Link></li>)}</ul></section>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-3"><Button variant="secondary" type="button" disabled={busy} onClick={() => navigate('/candidate/profile')}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</Button></div></form></>
}
