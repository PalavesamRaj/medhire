import React, { useEffect, useState } from 'react'
import { Building2, CheckCircle2, MapPin, Pencil, ShieldCheck } from 'lucide-react'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'
import { getAuthenticatedUser } from '../../lib/authSession'
import OrganizationDocuments from '../../components/recruiter/OrganizationDocuments'

const fieldGroups = [
  ['Organization Information', [['hospitalName', 'Hospital Name', true], ['registrationNumber', 'Registration Number', false], ['website', 'Website', false], ['hospitalPhone', 'Contact Number', true], ['address', 'Address', true], ['city', 'City', true], ['state', 'State', true], ['postal', 'ZIP / Postal Code', true], ['country', 'Country', true]]],
]
const blankProfile = { hospitalName: '', organizationType: '', registrationNumber: '', website: '', contactEmail: '', hospitalPhone: '', address: '', city: '', state: '', postal: '', country: '', recruiterName: '', designation: '', businessEmail: '', recruiterPhone: '' }

function unwrapResponse(payload) {
  let value = payload
  for (let depth = 0; depth < 5 && value && !Array.isArray(value); depth += 1) {
    if (value.data && typeof value.data === 'object') value = value.data
    else if (value.result && typeof value.result === 'object') value = value.result
    else break
  }
  return value || {}
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function normalizeProfile(payload = {}, authenticatedUser = {}) {
  const root = payload || {}
  const user = root.user ?? root.recruiter ?? authenticatedUser ?? {}
  const profile = root.profile ?? root.hospitalProfile ?? root.hospital_profile ?? root.organizationProfile ?? root.organization_profile ?? root
  const organization = profile.organization ?? profile.hospital ?? profile.organizationDetails ?? profile.organization_details ?? user.organization ?? user.hospital ?? profile
  const recruiter = profile.recruiter ?? profile.recruiterContact ?? profile.recruiter_contact ?? root.recruiter ?? root.recruiterContact ?? root.recruiter_contact ?? user
  const contact = organization.contact ?? organization.contacts ?? organization.contactInfo ?? organization.contact_info ?? profile.contact ?? profile.contacts ?? {}
  const addressValue = firstValue(organization.address, profile.address, contact.address)
  const addressObject = typeof addressValue === 'object' && addressValue ? addressValue : {}
  const address = typeof addressValue === 'object' && addressValue
    ? [addressObject.line1 ?? addressObject.addressLine1 ?? addressObject.address_line_1 ?? addressObject.street, addressObject.line2 ?? addressObject.addressLine2 ?? addressObject.address_line_2].filter(Boolean).join(', ')
    : addressValue
  const city = firstValue(organization.city, organization.cityName, organization.city_name, profile.city, profile.cityName, profile.city_name, addressObject.city, addressObject.cityName, addressObject.city_name)
  const state = firstValue(organization.state, organization.stateName, organization.state_name, profile.state, profile.stateName, profile.state_name, addressObject.state, addressObject.stateName, addressObject.state_name, addressObject.region)
  return {
    hospitalName: firstValue(organization.hospitalName, organization.hospital_name, organization.organizationName, organization.organization_name, organization.name, profile.hospitalName, profile.hospital_name, profile.organizationName, profile.organization_name, profile.name, root.hospitalName, root.hospital_name, root.organizationName, root.organization_name, root.name, user.organizationName, user.organization_name, user.hospitalName, user.organization?.name, user.organization?.organizationName) || '',
    organizationType: firstValue(organization.organizationType, organization.organization_type, organization.type, profile.organizationType, profile.organization_type) || '',
    registrationNumber: firstValue(organization.registrationNumber, organization.registration_number, organization.registrationNo, organization.registration_no, organization.registrationId, organization.registration_id, profile.registrationNumber, profile.registration_number, root.registrationNumber, root.registration_number, user.registrationNumber, user.registration_number, user.organization?.registrationNumber) || '',
    website: firstValue(organization.website, organization.websiteUrl, organization.website_url, profile.website, profile.websiteUrl, profile.website_url, root.website, root.organizationWebsite, root.organization_website, user.organizationWebsite, user.organization_website, user.orgWebsite, user.org_website, user.website, user.organization?.website) || '',
    contactEmail: firstValue(organization.contactEmail, organization.contact_email, contact.email, profile.contactEmail, profile.contact_email, root.contactEmail, root.contact_email, root.businessEmail, root.email, recruiter.businessEmail, recruiter.business_email, recruiter.email, user.businessEmail, user.business_email, user.email) || '',
    hospitalPhone: firstValue(organization.hospitalPhone, organization.hospital_phone, organization.contactNumber, organization.contact_number, organization.phone, organization.phoneNumber, organization.phone_number, contact.phone, profile.hospitalPhone, profile.hospital_phone, profile.contactNumber, profile.contact_number, profile.phone, root.hospitalPhone, root.hospital_phone, root.contactNumber, root.contact_number, root.phone, recruiter.phone, recruiter.phoneNumber, recruiter.phone_number, user.phone, user.phoneNumber, user.phone_number) || '',
    address: address || firstValue(root.address, user.address, user.organization?.address) || '', city: city || firstValue(root.city, user.city, user.organization?.city) || '', state: state || firstValue(root.state, user.state, user.organization?.state) || '',
    postal: firstValue(organization.postal, organization.postalCode, organization.postal_code, organization.zipCode, organization.zip_code, profile.postal, profile.postalCode, profile.postal_code, root.postal, root.postalCode, root.postal_code, addressObject.postalCode, addressObject.postal_code, addressObject.zip) || '',
    country: firstValue(organization.country, organization.countryCode, organization.country_code, profile.country, profile.countryCode, profile.country_code, root.country, root.countryCode, root.country_code, addressObject.country, addressObject.countryCode, addressObject.country_code) || '',
    recruiterName: firstValue(recruiter.recruiterName, recruiter.recruiter_name, recruiter.name, recruiter.fullName, recruiter.full_name, profile.recruiterName, profile.recruiter_name, root.recruiterName, root.recruiter_name, root.fullName, root.full_name, root.name, user.fullName, user.full_name, user.name) || '',
    designation: firstValue(recruiter.designation, recruiter.title, recruiter.role, profile.designation, root.designation, user.designation, user.jobTitle, user.job_title) || '',
    businessEmail: firstValue(recruiter.businessEmail, recruiter.business_email, recruiter.email, profile.businessEmail, profile.business_email, root.email, user.email) || '',
    recruiterPhone: firstValue(recruiter.recruiterPhone, recruiter.recruiter_phone, recruiter.phone, recruiter.phoneNumber, recruiter.phone_number, profile.recruiterPhone, profile.recruiter_phone, user.phone, user.phoneNumber, user.phone_number) || '',
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value.trim() ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
}

function normalizePreferences(root) {
  const profile = root.profile ?? root.hospitalProfile ?? root.hospital_profile ?? root.organizationProfile ?? root.organization_profile ?? {}
  const value = root.hiringPreferences ?? root.hiring_preferences ?? profile.hiringPreferences ?? profile.hiring_preferences ?? root.preferences ?? {}
  return {
    specialties: normalizeList(value.specialties ?? value.commonSpecialties ?? value.common_specialties),
    locations: normalizeList(value.locations ?? value.preferredLocations ?? value.preferred_locations),
    employmentTypes: normalizeList(value.employmentTypes ?? value.employment_types ?? value.employment ?? value.employmentPreferences ?? value.employment_preferences),
  }
}

function normalizeVerification(value) {
  if (typeof value === 'string') return { status: value }
  if (!value || typeof value !== 'object') return null
  return {
    ...value,
    status: value.status ?? value.verificationStatus ?? value.verification_status ?? value.organizationStatus ?? value.organization_status ?? 'Unavailable',
    verifiedAt: value.verifiedAt ?? value.verified_at ?? value.verifiedDate ?? value.verified_date ?? value.approvedAt ?? value.approved_at ?? '',
    licenseStatus: value.licenseStatus ?? value.license_status ?? value.organizationLicense ?? value.organization_license ?? value.organizationLicenseStatus ?? value.organization_license_status ?? value.license ?? '',
    accreditation: value.accreditation ?? value.accreditationStatus ?? value.accreditation_status ?? '',
  }
}

function getVerificationPayload(data) {
  const nested = data.verification ?? data.verificationDetails ?? data.verification_details ?? data.verificationStatus ?? data.verification_status ?? data.organization?.verification ?? data.organizationVerification ?? data.organization_verification
  if (nested && typeof nested === 'object') return nested
  const status = typeof nested === 'string' ? nested : data.status
  if (!status) return null
  return {
    status,
    verifiedAt: data.verifiedAt ?? data.verified_at ?? data.verifiedDate ?? data.verified_date,
    licenseStatus: data.licenseStatus ?? data.license_status ?? data.organizationLicense ?? data.organization_license ?? data.organizationLicenseStatus ?? data.organization_license_status,
    accreditation: data.accreditation ?? data.accreditationStatus ?? data.accreditation_status,
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
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    recruiterApi.getHospitalProfile().then((payload) => {
      if (!active) return
      const data = unwrapResponse(payload)
      const nextProfile = normalizeProfile(data, getAuthenticatedUser())
      setProfile(nextProfile); setDraft(nextProfile); setVerification(normalizeVerification(getVerificationPayload(data)))
      setPreferences(normalizePreferences(data))
      setNotice(Object.values(nextProfile).some(Boolean) ? '' : 'No organization profile details were returned. You can add them using Edit Profile.')
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
    if (draft.website) { try { const url = new URL(draft.website.startsWith('http') ? draft.website : `https://${draft.website}`); if (!['http:', 'https:'].includes(url.protocol)) throw Error() } catch { errors.website = 'Enter a valid website address.' } }
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setSaving(true); setError(null); setFieldErrors({})
    try {
      const body = {
        profile: {
          hospitalName: draft.hospitalName.trim(),
          registrationNumber: draft.registrationNumber.trim(),
          website: draft.website.trim(),
          hospitalPhone: draft.hospitalPhone.trim(),
          address: draft.address.trim(),
          city: draft.city.trim(),
          state: draft.state.trim(),
          postal: draft.postal.trim(),
          country: draft.country.trim(),
        },
        hiringPreferences: {
          specialties: preferences.specialties,
          locations: preferences.locations,
          employmentTypes: preferences.employmentTypes,
        },
      }
      if (body.profile.website) body.profile.website = /^https?:\/\//i.test(body.profile.website) ? body.profile.website : `https://${body.profile.website}`
      await recruiterApi.updateHospitalProfile(body)

      // Treat the GET response as authoritative. Some PATCH implementations return only
      // { message, success }, which must not replace the profile with an empty object.
      const refreshedPayload = await recruiterApi.getHospitalProfile()
      const data = unwrapResponse(refreshedPayload)
      const updated = normalizeProfile(data, getAuthenticatedUser())
      const updatedPreferences = normalizePreferences(data)
      const expected = {
        hospitalName: body.profile.hospitalName,
        registrationNumber: body.profile.registrationNumber,
        website: body.profile.website,
        hospitalPhone: body.profile.hospitalPhone,
        address: body.profile.address,
        city: body.profile.city,
        state: body.profile.state,
        postal: body.profile.postal,
        country: body.profile.country,
      }
      const differs = Object.keys(expected).some((key) => String(updated[key] || '').trim() !== String(expected[key] || '').trim())
        || JSON.stringify(updatedPreferences) !== JSON.stringify(body.hiringPreferences)

      setProfile(updated)
      setDraft(updated)
      setVerification(normalizeVerification(getVerificationPayload(data)))
      setPreferences(updatedPreferences)
      setEditing(false)
      setSaved(!differs)
      setNotice(differs
        ? 'The profile save request succeeded, but the latest backend profile does not match all submitted values. The values shown are the ones currently saved by the backend.'
        : '')
    } catch (requestError) { setError(requestError); setFieldErrors(requestError.fieldErrors || {}) }
    finally { setSaving(false) }
  }

  if (loading) return <RecruiterLoading label="Loading hospital profile…" />
  if (error && !profile.hospitalName) return <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
  const values = editing ? draft : profile
  const status = verification?.status || 'Unavailable'
  return <div className="flex flex-col gap-6">
    <header><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Organization Profile</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Hospital Profile</h1></header>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    {notice && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
    {saved && <p role="status" className="rounded-lg border border-emerald-100 bg-green-50 p-3 text-sm text-green-700">Hospital profile updated.</p>}
    <form onSubmit={saveEditing} className="flex flex-col gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Building2 className="h-8 w-8" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900 sm:text-xl">{values.hospitalName || 'Organization'}</h2><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${/approved|verified/i.test(status) ? 'border-emerald-100 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><CheckCircle2 className="h-3 w-3" />{status}</span></div><p className="mt-1.5 flex flex-wrap items-center gap-x-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{[values.city, values.state].filter(Boolean).join(', ') || 'Location unavailable'}{values.organizationType && <><span className="mx-2 text-slate-300">•</span>{values.organizationType}</>}</p></div></div>
        {!editing && <button type="button" onClick={startEditing} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit Profile</button>}
      </section>
      <OrganizationDocuments editable={false} />
      <div className="grid gap-5">
        {fieldGroups.map(([title, fields]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">{fields.map(([key, label, required]) => <label key={key} className="min-w-0"><span className="text-xs font-semibold uppercase text-slate-500">{label}</span>{editing ? <><input value={values[key]} required={required} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(fieldErrors[key])} className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 ${fieldErrors[key] ? 'border-red-400' : 'border-slate-200'}`} />{fieldErrors[key] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[key]}</span>}</> : <span className="mt-1 block break-words text-sm text-slate-700">{key === 'website' && values[key] ? <a className="text-blue-600 underline" href={/^https?:\/\//i.test(values[key]) ? values[key] : `https://${values[key]}`} target="_blank" rel="noreferrer">{values[key]}</a> : values[key] || '—'}</span>}</label>)}{[['recruiterName', 'Recruiter Name'], ['designation', 'Designation'], ['organizationType', 'Organization Type'], ['contactEmail', 'Official Work Email']].map(([key, label]) => <div key={key} className="min-w-0"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-700">{values[key] || '—'}</p></div>)}</div></section>)}
        <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-teal-700"><ShieldCheck className="h-5 w-5" />Verification Status</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><StatusField label="Verification Status" value={status} /><StatusField label="Verified Date" value={verification?.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : '—'} /><StatusField label="Organization License" value={verification?.licenseStatus || '—'} /><StatusField label="Accreditation" value={verification?.accreditation || '—'} /></div><p className="mt-5 border-t border-teal-100 pt-4 text-xs text-slate-500">Verification status is managed by MedHire. Contact support for updates.</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Hiring Preferences</h2><div className="mt-5 flex flex-col gap-5">{[['Common Specialties', 'specialties', 'bg-blue-50 text-blue-600'], ['Preferred Locations', 'locations', 'bg-slate-100 text-slate-700'], ['Employment Types', 'employmentTypes', 'bg-teal-50 text-teal-700']].map(([label, key, chipClass]) => <label key={key} className="block"><span className="text-xs font-semibold uppercase text-slate-500">{label}</span>{editing ? <input value={(preferences[key] || []).join(', ')} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" placeholder="Separate values with commas" /> : <span className="mt-2 flex flex-wrap gap-2">{preferences[key]?.length ? preferences[key].map((item) => <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${chipClass}`}>{item}</span>) : <span className="text-sm text-slate-700">—</span>}</span>}</label>)}</div></section>
      </div>
      {editing && <div className="flex flex-col gap-3 pb-4 sm:flex-row"><button type="submit" disabled={saving} className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button><button type="button" disabled={saving} onClick={cancelEditing} className="h-11 rounded-lg border border-slate-200 px-6 text-sm font-semibold text-slate-700">Cancel</button></div>}
    </form>
  </div>
}

function StatusField({ label, value }) { return <div><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><span className="mt-1.5 inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">{value}</span></div> }
