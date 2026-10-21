import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/authApi'
import { validatePassword } from '../lib/authValidation'

function unwrap(payload) {
  let value = payload
  for (let depth = 0; depth < 4 && value?.data && typeof value.data === 'object'; depth += 1) value = value.data
  return value || {}
}

export default function AcceptRecruiterInvitation() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [invitation, setInvitation] = useState(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    let active = true
    if (!token) {
      setError('This invitation link is missing its token. Ask the organization to send a new invitation.')
      setLoading(false)
      return undefined
    }
    authApi.getInvitationPreview(token).then((payload) => {
      if (!active) return
      const data = unwrap(payload)
      setInvitation(data.invitation ?? data)
      setFullName(data.invitation?.fullName ?? data.fullName ?? '')
    }).catch((reason) => { if (active) setError(reason.message || 'This invitation could not be verified.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await authApi.acceptInvitation({ token, password, ...(fullName.trim() ? { fullName: fullName.trim() } : {}) })
      setAccepted(true)
    } catch (reason) {
      setError(reason.message || 'The invitation could not be accepted.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <Link to="/login" className="text-sm font-bold text-teal-700">MedHire</Link>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Accept recruiter invitation</h1>
      {loading ? <p className="mt-3 text-sm text-slate-600">Checking invitation…</p> : accepted ? <div className="mt-4 space-y-4"><p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Invitation accepted. Sign in to continue to your organization.</p><Link to="/login?role=recruiter" className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white">Go to recruiter login</Link></div> : error && !invitation ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : invitation && <>
        <p className="mt-2 text-sm text-slate-600">Set a password to join {invitation.organizationName || invitation.organization?.name || 'the recruiting organization'}.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Full name (optional)<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-blue-500" /></label>
          <label className="block text-sm font-semibold text-slate-700">Create password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="invite-password-hint" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-blue-500" /><span id="invite-password-hint" className="mt-1 block text-xs font-normal text-slate-500">Use 8–72 characters with an uppercase letter, number, and symbol.</span></label>
          <button type="submit" disabled={submitting} className="h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50">{submitting ? 'Accepting…' : 'Accept invitation'}</button>
        </form>
      </>}
    </section>
  </main>
}
