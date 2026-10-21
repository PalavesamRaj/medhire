import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function RecruiterRejectApplicationDialog({ open, candidateName, jobTitle, reason, onReasonChange, onCancel, onConfirm, busy = false, error = '' }) {
  if (!open) return null
  const validReason = reason.trim().length > 0

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="reject-application-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><h2 id="reject-application-title" className="text-lg font-bold text-slate-900">Reject application</h2><p className="mt-1 text-sm leading-5 text-slate-500">Add a clear reason so your team can understand and track this decision.</p></div>
        <button type="button" aria-label="Close dialog" disabled={busy} onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-6 py-5">
        {(candidateName || jobTitle) && <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3"><p className="truncate text-sm font-semibold text-slate-800">{candidateName || 'Candidate'}</p>{jobTitle && <p className="mt-0.5 truncate text-xs text-slate-500">{jobTitle}</p>}</div>}
        <label htmlFor="rejection-reason" className="block text-sm font-semibold text-slate-700">Reason for rejection <span className="text-red-600">*</span></label>
        <textarea id="rejection-reason" autoFocus rows={4} maxLength={1000} value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="For example: Required experience does not match this role…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
        <div className="mt-1 flex justify-between gap-3 text-xs text-slate-400"><span>{error || 'This reason will be recorded with the application decision.'}</span><span className="shrink-0">{reason.length}/1000</span></div>
      </div>
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row">
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        <button type="button" disabled={!validReason || busy} onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Rejecting…' : 'Confirm rejection'}</button>
      </div>
    </section>
  </div>
}
