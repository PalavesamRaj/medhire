import React, { useEffect, useState } from 'react'
import { Building2, CheckCircle2, MapPin, Pencil, ShieldCheck } from 'lucide-react'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const fieldGroups = [
  ['Organization Information', [['hospitalName', 'Hospital Name', true], ['organizationType', 'Organization Type', true], ['registrationNumber', 'Registration Number', false], ['website', 'Website', false], ['contactEmail', 'Contact Email', true], ['hospitalPhone', 'Contact Number', true], ['address', 'Address', true], ['city', 'City', true], ['state', 'State', true], ['postal', 'ZIP / Postal Code', true], ['country', 'Country', true]]],
  ['Recruiter Contact Information', [['recruiterName', 'Recruiter Name', true], ['designation', 'Designation', true], ['businessEmail', 'Business Email', true], ['recruiterPhone', 'Contact Number', true]]],
]
const blankProfile = { hospitalName: '', organizationType: '', registrationNumber: '', website: '', contactEmail: '', hospitalPhone: '', address: '', city: '', state: '', postal: '', country: '', recruiterName: '', designation: '', businessEmail: '', recruiterPhone: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeProfile(profile = {}) {
  return {
    hospitalName: profile.hospitalName || profile.organizationName || '', organizationType: profile.organizationType || '', registrationNumber: profile.registrationNumber || '', website: profile.website || '', contactEmail: profile.contactEmail || '', hospitalPhone: profile.hospitalPhone || '', address: profile.address || '', city: profile.city || '', state: profile.state || '', postal: profile.postal || profile.postalCode || '', country: profile.country || '', recruiterName: profile.recruiterName || '', designation: profile.designation || '', businessEmail: profile.businessEmail || profile.email || '', recruiterPhone: profile.recruiterPhone || '',
  }
}

export default function RecruiterHospitalProfile() {
  const [profile, setProfile] = useState(blankProfile)
  const [draft, setDraft] = useState(blankProfile)
  const [verification, setVerification] = useState(null)
  const [preferences, setPreferences] = useState({ specialties: [], locations: [], employmentTypes: [] })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    recruiterApi.getHospitalProfile().then((payload) => {
      if (!active) return
      const data = payload?.data || payload
      const nextProfile = normalizeProfile(data?.profile)
      setProfile(nextProfile); setDraft(nextProfile); setVerification(data?.verification || null)
      setPreferences(data?.hiringPreferences || { specialties: [], locations: [], employmentTypes: [] })
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  const startEditing = () => { setDraft(profile); setFieldErrors({}); setEditing(true); setSaved(false) }
  const cancelEditing = () => { setDraft(profile); setFieldErrors({}); setEditing(false) }
  const update = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setFieldErrors((current) => ({ ...current, [key]: '' })) }
  const saveEditing = async (event) => {
    event.preventDefault()
    const errors = {}
    for (const [, fields] of fieldGroups) for (const [key, label, required] of fields) if (required && !draft[key].trim()) errors[key] = `${label} is required.`
    for (const key of ['contactEmail', 'businessEmail']) if (draft[key] && !emailPattern.test(draft[key].trim())) errors[key] = 'Enter a valid email address.'
    if (draft.website) { try { const url = new URL(draft.website.startsWith('http') ? draft.website : `https://${draft.website}`); if (!['http:', 'https:'].includes(url.protocol)) throw Error() } catch { errors.website = 'Enter a valid website address.' } }
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setSaving(true); setError(null); setFieldErrors({})
    try {
      const body = { profile: { ...draft, website: draft.website && !/^https?:\/\//i.test(draft.website) ? `https://${draft.website}` : draft.website }, hiringPreferences: preferences }
      const payload = await recruiterApi.updateHospitalProfile(body)
      const data = payload?.data || payload
      const updated = normalizeProfile(data?.profile || draft)
      setProfile(updated); setDraft(updated); setVerification(data?.verification || verification); setPreferences(data?.hiringPreferences || preferences); setEditing(false); setSaved(true)
    } catch (requestError) { setError(requestError); setFieldErrors(requestError.fieldErrors || {}) }
    finally { setSaving(false) }
  }

  if (loading) return <RecruiterLoading label="Loading hospital profile…" />
  if (error && !profile.hospitalName) return <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
  const values = editing ? draft : profile
  const status = verification?.status || 'Unavailable'
  return <div className="flex flex-col gap-6"><header><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Organization Profile</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Hospital Profile</h1></header>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    {saved && <p role="status" className="rounded-lg border border-emerald-100 bg-green-50 p-3 text-sm text-green-700">Hospital profile updated.</p>}
    <form onSubmit={saveEditing} className="flex flex-col gap-5"><section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"><div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Building2 className="h-8 w-8" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900 sm:text-xl">{values.hospitalName || 'Organization'}</h2><span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600"><CheckCircle2 className="h-3 w-3" />{status}</span></div><p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{[values.city, values.state].filter(Boolean).join(', ') || 'Location unavailable'}</p></div></div>{!editing && <button type="button" onClick={startEditing} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700"><Pencil className="h-3.5 w-3.5" />Edit Profile</button>}</section>
      <div className="grid gap-5 xl:grid-cols-2">{fieldGroups.map(([title, fields]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">{fields.map(([key, label, required]) => <label key={key} className="min-w-0"><span className="text-xs font-semibold uppercase text-slate-500">{label}</span>{editing ? <><input value={values[key]} required={required} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(fieldErrors[key])} className={`mt-1 h-9 w-full rounded-md border px-2.5 text-sm outline-none focus:border-blue-500 ${fieldErrors[key] ? 'border-red-400' : 'border-slate-200'}`} />{fieldErrors[key] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[key]}</span>}</> : <span className="mt-1 block break-words text-sm text-slate-700">{values[key] || '—'}</span>}</label>)}</div></section>)}
        <section className="rounded-2xl border border-teal-100 bg-teal-50 p-5 sm:p-6 xl:col-span-2"><h2 className="flex items-center gap-2 text-lg font-bold text-teal-700"><ShieldCheck className="h-4 w-4" />Verification Status</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatusField label="Status" value={status} /><StatusField label="Verified Date" value={verification?.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : '—'} /><StatusField label="Organization License" value={verification?.licenseStatus || '—'} /><StatusField label="Accreditation" value={verification?.accreditation || '—'} /></div><p className="mt-5 border-t border-teal-100 pt-4 text-xs text-slate-500">Verification data is managed by MedHire.</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2"><h2 className="text-lg font-bold text-slate-900">Hiring Preferences</h2>{[['Common Specialties', 'specialties'], ['Preferred Locations', 'locations'], ['Employment Types', 'employmentTypes']].map(([label, key]) => <label key={key} className="mt-5 block"><span className="text-xs font-semibold uppercase text-slate-500">{label}</span>{editing ? <input value={(preferences[key] || []).join(', ')} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Separate values with commas" /> : <span className="mt-2 block text-sm text-slate-700">{preferences[key]?.length ? preferences[key].join(', ') : '—'}</span>}</label>)}</section>
      </div>
      {editing && <div className="flex flex-col gap-3 pb-4 sm:flex-row"><button type="submit" disabled={saving} className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button><button type="button" disabled={saving} onClick={cancelEditing} className="h-11 rounded-lg border border-slate-200 px-6 text-sm font-semibold text-slate-700">Cancel</button></div>}
    </form>
  </div>
}

function StatusField({ label, value }) { return <div><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><span className="mt-1.5 inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">{value}</span></div> }
