import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, CircleHelp, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/layout/Logo'
import { getAuthenticatedUser, updateAuthenticatedUser } from '../../lib/authSession'
import { logout } from '../../lib/http'
import { authApi } from '../../lib/authApi'
import { recruiterApi } from '../../lib/recruiterApi'
import OrganizationDocuments from '../../components/recruiter/OrganizationDocuments'

export default function RecruiterVerificationPending() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getAuthenticatedUser)

  // Re-check the organization status so the recruiter never has to sign out and in to see the decision.
  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const response = await authApi.me()
        const fresh = response?.user || response?.data?.user
        if (!active || !fresh) return
        updateAuthenticatedUser(fresh)
        setUser((previous) => ({ ...previous, ...fresh }))
        const status = String(fresh.organizationVerificationStatus || '').toLowerCase()
        if (['approved', 'verified'].includes(status)) navigate('/recruiter/dashboard', { replace: true })
      } catch { /* keep showing the last known status */ }
    }
    check()
    const timer = setInterval(check, 30000)
    window.addEventListener('focus', check)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check) }
  }, [navigate])
  const registrationDetails = [
    ['Hospital / Organization', user?.organizationName || user?.organization?.name || 'Organization details pending'],
    ['Recruiter Name', user?.fullName || 'Recruiter'],
    ['Business Email', user?.email || ''],
    ['Contact Number', user?.phone || ''],
    ['Registration Date', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Pending'],
  ]

  const rejected = String(user?.organizationVerificationStatus || '').toLowerCase() === 'rejected'
  const [editValues, setEditValues] = useState({ hospitalName: user?.organizationName || user?.organization?.name || '', registrationNumber: user?.registrationNumber || user?.organization?.registrationNumber || '', website: user?.website || user?.organization?.website || '', address: user?.address || user?.organization?.address || '', city: user?.city || user?.organization?.city || '', state: user?.state || user?.organization?.state || '' })
  const [editing, setEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const resubmit = async () => {
    setSaving(true)
    setError('')
    try {
      await recruiterApi.resubmitOrganization(note.trim())
      updateAuthenticatedUser({ organizationVerificationStatus: 'pending' })
      navigate(0)
    } catch (requestError) {
      setError(requestError.message || 'Unable to resubmit. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  const saveRejectedProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setError('')
    try {
      const response = await recruiterApi.updateHospitalProfile({ profile: editValues })
      const updated = response?.data?.profile || response?.profile || editValues
      setEditValues({ ...editValues, ...updated })
      updateAuthenticatedUser({ organizationName: updated.hospitalName || updated.organizationName || editValues.hospitalName, registrationNumber: updated.registrationNumber || editValues.registrationNumber, website: updated.website || editValues.website, address: updated.address || editValues.address, city: updated.city || editValues.city, state: updated.state || editValues.state })
      setEditing(false)
    } catch (requestError) { setError(requestError.message || 'Unable to update organization details.') }
    finally { setProfileSaving(false) }
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login?role=recruiter')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 sm:px-12">
        <Link to="/" aria-label="MedHire home">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 py-12 sm:px-12 lg:py-16">
        <section className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Account Status</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{rejected ? 'Verification Not Approved' : 'Account Verification Pending'}</h1>
          <p className="text-sm leading-5 text-slate-500">
            Your recruiter account is being reviewed by the MedHire team. We verify hospital and
            organization information before enabling candidate access.
          </p>
        </section>

        <OrganizationDocuments />

        {rejected && <section className="w-full rounded-xl border border-red-200 bg-red-50 p-5" aria-label="Resubmit for review">
          <h2 className="text-sm font-bold text-red-800">Why it was not approved</h2>
          <p className="mt-1 text-sm text-red-700">{user?.rejectionReason || user?.organizationRejectionReason || 'No reason was provided. Please contact support.'}</p>
          <form onSubmit={saveRejectedProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries({ hospitalName: 'Organization name', registrationNumber: 'Registration number', website: 'Website', address: 'Address', city: 'City', state: 'State' }).map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate-700">{label}<input value={editValues[key]} disabled={!editing || profileSaving} onChange={(event) => setEditValues((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-normal" /></label>)}
            <div className="flex items-center gap-2 sm:col-span-2">{editing ? <><button type="submit" disabled={profileSaving} className="h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white disabled:opacity-50">{profileSaving ? 'Saving…' : 'Save organization details'}</button><button type="button" disabled={profileSaving} onClick={() => setEditing(false)} className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold">Cancel</button></> : <button type="button" onClick={() => setEditing(true)} className="h-9 rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold text-red-800">Edit organization details</button>}</div>
          </form>
          <label htmlFor="resubmit-note" className="mt-4 block text-sm font-semibold text-slate-900">Note for the reviewer (what you corrected)</label>
          <textarea id="resubmit-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <button type="button" onClick={resubmit} disabled={saving} className="mt-3 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Submitting…' : 'Resubmit for Review'}</button>
        </section>}
        <section className="flex w-full items-center" aria-label="Verification progress">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50">
              <Check className="h-3.5 w-3.5 text-blue-600" />
            </span>
            <span className="hidden text-xs font-semibold text-slate-900 sm:inline">Registered</span>
          </div>
          <span className="h-0.5 flex-1 bg-blue-600" />
          <div className="flex shrink-0 items-center gap-2 px-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600 bg-white shadow-[0_0_8px_2px_rgba(37,99,235,0.2)]">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
            </span>
            <span className="flex flex-col gap-0.5 text-xs font-semibold text-blue-600">
              <span>Under Review</span>
              <span className="font-medium">In Progress</span>
            </span>
          </div>
          <span className="h-0.5 flex-1 bg-slate-200" />
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-xs font-bold text-slate-400">
              3
            </span>
            <span className="hidden text-xs font-medium text-slate-400 sm:inline">Approved</span>
          </div>
        </section>

        <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Registration Details</h2>
            <span className="shrink-0 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              Pending Verification
            </span>
          </div>
          <div className="my-5 border-t border-slate-100" />
          <dl className="flex flex-col gap-3">
            {registrationDetails.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-6 text-xs">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex w-full items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>We will notify you by email once your account has been approved. This typically takes 1-2 business days.</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link
            to="/recruiter/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Continue to Dashboard
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Contact Support
          </Link>
          <Link
            to="/"
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
