import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../lib/authApi'
import { getAccessToken, updateAuthenticatedUser } from '../lib/authSession'
import { validatePassword, validateEmail } from '../lib/authValidation'
import PageHeading from '../components/candidate/dashboard/PageHeading'

export default function AccountSecurity() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailStep, setEmailStep] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  if (!getAccessToken()) return <Navigate to="/login" replace />
  const changePassword = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    const invalid = validatePassword(newPassword)
    if (invalid) { setBusy(false); setError(invalid); return }
    if (newPassword !== confirmPassword) { setBusy(false); setError('New passwords do not match.'); return }
    try { await authApi.changePassword({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNotice('Password changed. Other active sessions have been revoked.') }
    catch (reason) { setError(reason.message || 'Unable to change password.') } finally { setBusy(false) }
  }
  const sendEmailCode = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    const invalid = validateEmail(newEmail)
    if (invalid) { setBusy(false); setError(invalid); return }
    try { await authApi.changeEmail({ newEmail: newEmail.trim().toLowerCase(), password: currentPassword }); setEmailStep(true); setNotice(`A verification code was sent to ${newEmail}.`) }
    catch (reason) { setError(reason.message || 'Unable to start the email change.') } finally { setBusy(false) }
  }
  const verifyEmail = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { const response = await authApi.verifyCode({ email: newEmail.trim().toLowerCase(), code, purpose: 'email_change' }); const user = response?.user || response?.data?.user; if (user) updateAuthenticatedUser(user); setEmailStep(false); setCode(''); setNewEmail(''); setNotice('Email address updated.') }
    catch (reason) { setError(reason.message || 'Unable to verify the new email address.') } finally { setBusy(false) }
  }
  return <div className="mx-auto max-w-3xl space-y-6"><PageHeading title="Account Security" subtitle="Change your password or verified email address." />
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={changePassword} className="med-card space-y-4"><h2 className="med-heading-3">Change password</h2><label className="block text-sm font-semibold">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label><label className="block text-sm font-semibold">New password<input required type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label><label className="block text-sm font-semibold">Confirm new password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label><button disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Update password</button></form>
    <form onSubmit={emailStep ? verifyEmail : sendEmailCode} className="med-card space-y-4"><h2 className="med-heading-3">Change email</h2><label className="block text-sm font-semibold">New email address<input required type="email" value={newEmail} disabled={emailStep} onChange={event => setNewEmail(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label>{!emailStep && <label className="block text-sm font-semibold">Confirm with your password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label>}{emailStep && <label className="block text-sm font-semibold">Six-digit verification code<input required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1 h-10 w-full rounded-md border border-ink-200 px-3"/></label>}<button disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{emailStep ? 'Verify email change' : 'Send verification code'}</button>{emailStep && <button type="button" onClick={() => { setEmailStep(false); setCode('') }} className="ml-3 text-sm font-semibold text-ink-600">Cancel</button>}</form>
  </div>
}
