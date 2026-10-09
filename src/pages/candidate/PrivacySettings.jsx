import React, { useState, useEffect } from 'react'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'
import AccountDataPanel from '../../components/candidate/dashboard/AccountDataPanel'

const visibilityControls = [
  ['maskContact', 'Mask my contact details until unlocked', 'Your contact info stays hidden until a recruiter unlocks your profile.'],
  ['searchable', 'Make my profile visible in search', 'Allow your profile to appear in recruiter search results.'],
  ['resumeVisible', 'Make my approved resume visible', 'Allow recruiters to view your approved resume.'],
  ['openToWork', 'Show that I am open to work', 'Display your job-search availability on your profile.'],
]
function SettingRow({ label, description, checked, onChange, children }) {
  return <div className="flex items-center justify-between gap-5 border-b border-ink-200 py-4 last:border-0"><div><h3 className="med-body font-semibold">{label}</h3><p className="med-caption mt-1 text-ink-400">{description}</p></div>{children || <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={checked === undefined} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-brand-600' : 'bg-ink-200'}`}><span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} /></button>}</div>
}
export default function PrivacySettings() {
  const { privacy, candidate, applications, resumes, dispatch } = useCandidateDashboard()
  const [form, setForm] = useState({ ...privacy })
  const hasServerPreferences = ['maskContact', 'searchable', 'resumeVisible', 'openToWork'].every((key) => typeof form[key] === 'boolean')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  useEffect(() => { setForm({ ...privacy }) }, [privacy])
  const update = (name, value) => setForm((previous) => ({ ...previous, [name]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await candidateDashboardApi.updatePrivacySettings({ profileVisible: form.searchable, recruiterDiscoverable: form.searchable, resumeVisible: form.resumeVisible, contactVisible: !form.maskContact, openToWork: form.openToWork })
      dispatch({ type: 'privacy', data: form })
      toast('Privacy preferences saved.')
    } catch (requestError) { setError(requestError.message || 'Unable to save privacy preferences.') }
    finally { setBusy(false) }
  }
  return <><PageHeading title="Privacy Settings" subtitle="Control your profile visibility" /><form noValidate onSubmit={submit} className="space-y-6">
    {error && <p role="alert" className="med-body text-red-600">{error}</p>}
    {!hasServerPreferences && <p role="status" className="med-caption rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">The privacy preferences could not be loaded from the server, so they cannot be changed yet.</p>}
    <section className="med-card !py-2" aria-label="Profile visibility">{visibilityControls.map(([name, label, description]) => <SettingRow key={name} label={label} description={description} checked={form[name]} onChange={(value) => update(name, value)} />)}</section>
    <section className="med-card !py-2">
      <div className="pt-4">
        <h2 className="med-heading-3">Security &amp; notifications</h2>
        <p className="med-caption mt-1 text-ink-400">Manage how we communicate with you and protect your account.</p>
      </div>
      <SettingRow label="Email notification preferences" description="This setting is not included in the current backend contract."><span className="med-caption text-ink-400">Unavailable</span></SettingRow>
      <SettingRow label="Two-factor authentication" description="This setting is not included in the current backend contract."><span className="med-caption text-ink-400">Unavailable</span></SettingRow>
    </section>
    <div className="flex justify-end">
      <Button type="submit" disabled={busy || !hasServerPreferences}>{busy ? 'Saving…' : 'Save Preferences'}</Button>
    </div>
  </form><AccountDataPanel /></>
}
