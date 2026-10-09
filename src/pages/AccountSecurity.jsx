import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react'
import { authApi } from '../lib/authApi'
import { getAccessToken, updateAuthenticatedUser } from '../lib/authSession'
import { validatePassword, validateEmail } from '../lib/authValidation'
import PageHeading from '../components/candidate/dashboard/PageHeading'
import Button from '../components/ui/Button'

function SecurityCard({ icon: Icon, title, description, children }) {
  return (
    <section className="med-card h-full space-y-5" aria-labelledby={`${title.toLowerCase().replaceAll(' ', '-')}-title`}>
      <div className="flex items-start gap-3 border-b border-ink-100 pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${title.toLowerCase().replaceAll(' ', '-')}-title`} className="med-heading-3">{title}</h2>
          <p className="med-caption mt-1 text-ink-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function FormField({ id, label, type = 'text', ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink-900">{label}</label>
      <input id={id} type={type} className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400" {...props} />
    </div>
  )
}

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
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const invalid = validatePassword(newPassword)
    if (invalid) { setBusy(false); setError(invalid); return }
    if (newPassword !== confirmPassword) { setBusy(false); setError('New passwords do not match.'); return }
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNotice('Password changed. Other active sessions have been revoked.')
    } catch (reason) {
      setError(reason.message || 'Unable to change password.')
    } finally {
      setBusy(false)
    }
  }

  const sendEmailCode = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const invalid = validateEmail(newEmail)
    if (invalid) { setBusy(false); setError(invalid); return }
    try {
      await authApi.changeEmail({ newEmail: newEmail.trim().toLowerCase(), password: currentPassword })
      setEmailStep(true)
      setNotice(`A verification code was sent to ${newEmail}.`)
    } catch (reason) {
      setError(reason.message || 'Unable to start the email change.')
    } finally {
      setBusy(false)
    }
  }

  const verifyEmail = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await authApi.verifyCode({ email: newEmail.trim().toLowerCase(), code, purpose: 'email_change' })
      const user = response?.user || response?.data?.user
      if (user) updateAuthenticatedUser(user)
      setEmailStep(false)
      setCode('')
      setNewEmail('')
      setCurrentPassword('')
      setNotice('Email address updated.')
    } catch (reason) {
      setError(reason.message || 'Unable to verify the new email address.')
    } finally {
      setBusy(false)
    }
  }

  const cancelEmailChange = () => {
    setEmailStep(false)
    setCode('')
    setNewEmail('')
    setError('')
    setNotice('')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeading title="Account Security" subtitle="Manage the credentials that protect your MedHire account." />

      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 text-brand-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Keep your account details up to date</p>
          <p className="mt-1 text-sm text-ink-600">A verified email helps you recover access, and a strong password helps keep your profile secure.</p>
        </div>
      </div>

      {(error || notice) && (
        <div role={error ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error ? <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{error || notice}</span>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <SecurityCard icon={LockKeyhole} title="Change password" description="Use a unique password that you do not use on other sites.">
          <form onSubmit={changePassword} className="space-y-4">
            <FormField id="current-password" label="Current password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="new-password" label="New password" type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <FormField id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <p className="text-xs leading-relaxed text-ink-400">Changing your password signs out other active sessions.</p>
            <div className="flex justify-end border-t border-ink-100 pt-4">
              <Button type="submit" disabled={busy} icon={KeyRound}>{busy ? 'Updating…' : 'Update password'}</Button>
            </div>
          </form>
        </SecurityCard>

        <SecurityCard icon={Mail} title="Change email" description="Verify your new address before it becomes the email on your account.">
          <form onSubmit={emailStep ? verifyEmail : sendEmailCode} className="space-y-4">
            {emailStep && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>Enter the six-digit code sent to <span className="font-semibold">{newEmail}</span>.</p>
              </div>
            )}
            <FormField id="new-email" label="New email address" type="email" autoComplete="email" placeholder="you@example.com" required value={newEmail} disabled={emailStep || busy} onChange={(event) => setNewEmail(event.target.value)} />
            {!emailStep && <FormField id="email-password" label="Confirm with your password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />}
            {emailStep && <FormField id="email-code" label="Verification code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="6-digit code" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />}
            <p className="text-xs leading-relaxed text-ink-400">Your new email will be used for sign-in after verification.</p>
            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4">
              {emailStep && <Button type="button" variant="secondary" disabled={busy} onClick={cancelEmailChange}>Cancel</Button>}
              <Button type="submit" disabled={busy} icon={emailStep ? CheckCircle2 : ArrowRight}>{busy ? 'Please wait…' : emailStep ? 'Verify email' : 'Send verification code'}</Button>
            </div>
          </form>
        </SecurityCard>
      </div>
    </div>
  )
}
