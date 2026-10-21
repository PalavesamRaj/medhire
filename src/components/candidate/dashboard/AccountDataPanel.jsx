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
    setBusy(true); setError('')
    try {
      await candidateDashboardApi.deleteMyAccount()
      clearAuthSession()
      toast('Your account has been deactivated.')
      navigate('/', { replace: true })
    } catch (requestError) { setError(requestError.message || 'Unable to delete your account.') }
    finally { setBusy(false) }
  }

  return (
    <section className="med-card mt-6" aria-label="Your data and account">
      <h2 className="med-heading-3">Your data</h2>
      <p className="med-caption mt-1 text-ink-400">Download your account data or deactivate your MedHire account.</p>
      {error && <p role="alert" className="med-body mt-3 text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={exportData}>{busy && !confirming ? 'Preparing…' : 'Download my data'}</Button>
        {!confirming && <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(true)}>Delete my account</Button>}
      </div>
      {confirming && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">You will be signed out and your account will be deactivated.</p>
          <div className="mt-3 flex gap-3">
            <Button type="button" size="sm" disabled={busy} onClick={deleteAccount}>{busy ? 'Deleting…' : 'Delete permanently'}</Button>
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => { setConfirming(false); setError('') }}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  )
}
