import React, { useEffect, useRef, useState } from 'react'
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
import { saveEditProfileOverrides } from '../../lib/candidateProfileDraft'
import { getAuthenticatedUser } from '../../lib/authSession'
import { Link } from 'react-router-dom'

export default function EditProfile() {
  const { profile, loading: profileLoading, updateSection, candidate: profileCandidate } = useCandidateProfile()
  const { candidate, dispatch, resumes } = useCandidateDashboard()
  const [form, setForm] = useState(() => Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key]])))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const backupInput = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()
  useEffect(() => {
    if (profileLoading) return
    setForm(Object.fromEntries(['firstName', 'lastName', 'headline', 'location', 'summary'].map((key) => [key, candidate[key] || ''])))
  }, [profileLoading, candidate.firstName, candidate.lastName, candidate.headline, candidate.location, candidate.summary])
  const update = (name, value) => { setForm((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: undefined })) }
  const completion = getCandidateProfileCompletion(profile, { hasSavedResume: Boolean(resumes?.length) })
  const { sections } = completion
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
      saveEditProfileOverrides(data)
      updateSection('personalInformation', personalInformation)
      updateSection('professionalInformation', professionalInformation)
      dispatch({ type: 'edit', data })
      toast('Profile changes saved.')
      navigate('/candidate/profile')
    } catch (requestError) { setError(requestError.message || 'Unable to save your profile changes.') }
    finally { setBusy(false) }
  }
  const exportSavedProfile = () => {
    const user = getAuthenticatedUser() || {}
    const candidateEmail = String(user.email || user.userEmail || profileCandidate?.email || profile.personalInformation?.email || '').trim().toLowerCase()
    const backup = {
      app: 'MedHire candidate profile',
      version: 1,
      candidateEmail,
      profile: Object.fromEntries(['personalInformation', 'professionalInformation', 'education', 'workExperience', 'skills', 'certifications', 'careerPreferences']
        .map((key) => [key, profile[key]])),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'medhire-candidate-profile-backup.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const importSavedProfile = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const backup = JSON.parse(await file.text())
      const user = getAuthenticatedUser() || {}
      const activeEmail = String(user.email || user.userEmail || profileCandidate?.email || profile.personalInformation?.email || '').trim().toLowerCase()
      if (backup.app !== 'MedHire candidate profile' || backup.version !== 1 || !backup.profile || typeof backup.profile !== 'object') {
        throw new Error('This file is not a supported MedHire profile backup.')
      }
      if (!activeEmail || !backup.candidateEmail || backup.candidateEmail !== activeEmail) {
        throw new Error('This backup belongs to a different candidate account. Sign in to the matching account and try again.')
      }
      const saved = backup.profile
      const personal = saved.personalInformation
      const professional = saved.professionalInformation
      const education = Array.isArray(saved.education) ? saved.education : []
      const workExperience = Array.isArray(saved.workExperience) ? saved.workExperience : []
      const skills = Array.isArray(saved.skills) ? saved.skills : []
      const certifications = Array.isArray(saved.certifications) ? saved.certifications : []
      const preferences = saved.careerPreferences
      const requests = []
      if (personal && typeof personal === 'object') requests.push(candidateProfileApi.savePersonalInformation(personal))
      if (professional && typeof professional === 'object') requests.push(candidateProfileApi.saveProfessionalInformation(professional))
      if (education.length) requests.push(candidateProfileApi.saveEducation(education))
      if (workExperience.length) requests.push(candidateProfileApi.saveWorkExperience(workExperience))
      if (skills.length) requests.push(candidateProfileApi.saveSkills({ skills }))
      if (certifications.length) requests.push(candidateProfileApi.saveCertifications({ certifications }))
      if (preferences && typeof preferences === 'object' && Object.keys(preferences).length) requests.push(candidateProfileApi.saveCareerPreferences(preferences))
      if (!requests.length) throw new Error('The backup does not contain any profile sections to restore.')
      await Promise.all(requests)
      if (personal) updateSection('personalInformation', personal)
      if (professional) updateSection('professionalInformation', professional)
      if (education.length) updateSection('education', education)
      if (workExperience.length) updateSection('workExperience', workExperience)
      if (skills.length) updateSection('skills', skills)
      if (certifications.length) updateSection('certifications', certifications)
      if (preferences) updateSection('careerPreferences', preferences)
      const [city = '', ...stateParts] = String(form.location || '').split(',')
      const location = [personal?.city || city.trim(), personal?.state || stateParts.join(',').trim()].filter(Boolean).join(', ')
      const restoredForm = {
        firstName: personal?.firstName || form.firstName,
        lastName: personal?.lastName || form.lastName,
        headline: professional?.currentJobTitle || form.headline,
        location,
        summary: professional?.professionalSummary || form.summary,
      }
      setForm(restoredForm)
      saveEditProfileOverrides(restoredForm)
      dispatch({ type: 'edit', data: restoredForm })
      toast('Profile backup restored to your account.')
    } catch (importError) {
      setError(importError.message || 'Unable to restore this profile backup.')
    } finally {
      setBusy(false)
      if (backupInput.current) backupInput.current.value = ''
    }
  }
  if (profileLoading) return <><PageHeading title="Edit Profile" subtitle="Loading your saved profile…" /><div className="med-card" role="status">Loading saved profile and completion…</div></>
  return <><PageHeading title="Edit Profile" subtitle="Update your profile summary" /><div className="med-card mb-4"><div className="flex items-center justify-between gap-3"><h2 className="med-heading-3">Profile completion</h2><span className="med-body font-semibold text-brand-600">{completion.percentage}%</span></div><div role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage} className="mt-3 h-2.5 rounded-full bg-brand-50"><div style={{ width: `${completion.percentage}%` }} className="h-full rounded-full bg-green-600" /></div></div><form noValidate onSubmit={submit} className="med-card space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[['firstName', 'First Name'], ['lastName', 'Last Name'], ['headline', 'Headline'], ['location', 'Location'], ['summary', 'Summary']].map(([name, label], index) => <ProfileField key={name} name={name} label={label} type={name === 'summary' ? 'textarea' : 'text'} wide={index > 1} value={form[name]} error={errors[name]} onChange={(value) => update(name, value)} />)}</div>
    <section className="border-t border-ink-200 pt-5"><h2 className="med-heading-3">Complete your profile sections</h2><p className="med-caption mt-1 text-ink-600">Open a section to add missing information or update what you have already provided.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{sections.map((section) => <li key={section.key}><Link to={section.path} state={{ returnTo: '/candidate/edit-profile' }} className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 text-sm hover:border-brand-600 hover:bg-brand-50"><span>{section.label}</span><span className={section.complete ? 'text-green-700' : 'text-brand-600'}>{section.complete ? 'Complete' : section.optional ? 'Optional · Add' : 'Add details'} →</span></Link></li>)}</ul></section>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={exportSavedProfile} className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50">Export saved profile</button><button type="button" disabled={busy} onClick={() => backupInput.current?.click()} className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50">{busy ? 'Restoring…' : 'Import profile backup'}</button><input ref={backupInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose MedHire profile backup" onChange={(event) => importSavedProfile(event.target.files?.[0])} /></div><div className="flex justify-end gap-3"><Button variant="secondary" type="button" disabled={busy} onClick={() => navigate('/candidate/profile')}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</Button></div><p className="w-full text-xs text-ink-500">To move a saved browser profile between localhost and Vercel, export it here and import it while signed in to the same candidate account on the other site.</p></div></form></>
}
