import React from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

export function RecruiterLoading({ label = 'Loading recruiter data…' }) {
  return <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />{label}</div>
}

export function RecruiterApiError({ error, onRetry }) {
  if (!error) return null
  return <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error.message || 'Unable to load recruiter data.'}</span>{onRetry && <button type="button" onClick={onRetry} className="self-start font-semibold underline sm:self-auto">Try again</button>}</div>
}

export function RecruiterEmpty({ children = 'No data is available yet.' }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</div>
}

export function getListResponse(payload) {
  const envelope = payload?.data || payload
  return {
    items: Array.isArray(envelope?.items) ? envelope.items : [],
    pagination: envelope?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  }
}

export function getErrorText(error) {
  if (error?.fieldErrors && Object.keys(error.fieldErrors).length) return Object.values(error.fieldErrors).join(' ')
  return error?.message || 'Unable to complete the request. Please try again.'
}
