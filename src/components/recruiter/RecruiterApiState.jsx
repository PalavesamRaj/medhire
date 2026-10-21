import React from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

export function RecruiterLoading({ label = 'Loading recruiter data…' }) {
  return <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />{label}</div>
}

export function RecruiterApiError({ error, onRetry }) {
  if (!error) return null
  const fields = error.fieldErrors && typeof error.fieldErrors === 'object' ? Object.entries(error.fieldErrors) : []
  const detailMessage = typeof error.details === 'string' ? error.details : error.details?.message
  return <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-start sm:justify-between"><div><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error.message || 'Unable to load recruiter data.'}</span>{fields.length > 0 && <ul className="ml-6 mt-2 list-disc">{fields.map(([field, message]) => <li key={field}><span className="font-semibold">{field}:</span> {Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : JSON.stringify(message)}</li>)}</ul>}{detailMessage && detailMessage !== error.message && <p className="ml-6 mt-2">{detailMessage}</p>}{error.requestId && <p className="ml-6 mt-2 text-xs">Request ID: {error.requestId}</p>}</div>{onRetry && <button type="button" onClick={onRetry} className="self-start font-semibold underline sm:self-auto">Try again</button>}</div>
}

export function RecruiterEmpty({ children = 'No data is available yet.' }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</div>
}

export function getListResponse(payload) {
  const envelope = payload?.data || payload
  return {
    items: Array.isArray(envelope) ? envelope : Array.isArray(envelope?.items) ? envelope.items : Array.isArray(envelope?.results) ? envelope.results : [],
    pagination: payload?.pagination || envelope?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  }
}

export function getErrorText(error) {
  if (error?.fieldErrors && Object.keys(error.fieldErrors).length) return Object.values(error.fieldErrors).join(' ')
  return error?.message || 'Unable to complete the request. Please try again.'
}
