import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../ui/Button'
import { useToast } from '../../ui/ToastProvider'
import { candidateDashboardApi } from '../../../lib/candidateDashboardApi'
import { clearAuthSession } from '../../../lib/authSession'

// Server-side data export and permanent account deletion (data-protection rights).
export default function AccountDataPanel() {
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function exportData() {
    setBusy(true); setError('')
    try {
      const payload = await candidateDashboardApi.exportMyData()
      const file = new Blob([JSON.stringify(payload?.data ?? payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'medhire-my-data.json'
      anchor.click()
      URL.revokeObjectURL(url)
      toast('Your data export has been downloaded.')
    } catch (requestError) { setError(requestError.message || 'Unable to export your data.') }
    finally { setBusy(false) }
  }

  async function deleteAccount() {
    if (!password) return setError('Enter your password to confirm.')
    setBusy(true); setError('')
    try {
      await candidateDashboardApi.deleteMyAccount({ password })
      clearAuthSession()
      toast('Your account has been deleted.')
      navigate('/', { replace: true })
    } catch (requestError) { setError(requestError.message || 'Unable to delete your account.') }
    finally { setBusy(false) }
  }

  return (
    <section className="med-card mt-6" aria-label="Your data and account">
      <h2 className="med-heading-3">Your data</h2>
      <p className="med-caption mt-1 text-ink-400">Download everything MedHire holds about you, or permanently delete your account.</p>
      {error && <p role="alert" className="med-body mt-3 text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={exportData}>{busy && !confirming ? 'Preparing…' : 'Download my data'}</Button>
        {!confirming && <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(true)}>Delete my account</Button>}
      </div>
      {confirming && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">This permanently removes your profile and resumes and cannot be undone.</p>
          <label htmlFor="delete-password" className="mt-3 block text-sm text-slate-700">Enter your password to confirm</label>
          <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); deleteAccount() } }} className="mt-1 h-10 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 text-sm" />
          <div className="mt-3 flex gap-3">
            <Button type="button" size="sm" disabled={busy} onClick={deleteAccount}>{busy ? 'Deleting…' : 'Delete permanently'}</Button>
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => { setConfirming(false); setPassword(''); setError('') }}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  )
}
