import React, { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const statusStyles = { Successful: 'border-emerald-100 bg-green-50 text-green-600', Failed: 'border-red-100 bg-red-50 text-red-500', Pending: 'border-amber-100 bg-amber-50 text-amber-600' }

export default function RecruiterPaymentHistory() {
  const [status, setStatus] = useState('')
  const [range, setRange] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    const endDate = new Date()
    let startDate
    if (range === 'Last 30 days') { startDate = new Date(); startDate.setDate(startDate.getDate() - 30) }
    if (range === 'Last 90 days') { startDate = new Date(); startDate.setDate(startDate.getDate() - 90) }
    if (range === 'This year') startDate = new Date(new Date().getFullYear(), 0, 1)
    setLoading(true); setError(null)
    recruiterApi.getPaymentHistory({ status, startDate: startDate?.toISOString(), endDate: range ? endDate.toISOString() : '', page, pageSize: 20 }).then((payload) => {
      if (!active) return
      const result = getListResponse(payload); setItems(result.items); setPagination(result.pagination)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, range, page, reload])

  const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'
  const formatAmount = (amount, currency) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount)) } catch { return `${amount ?? '—'} ${currency || ''}` } }

  return <div className="flex flex-col gap-5"><header><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Payment History</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Payment History</h1><p className="mt-1 text-sm text-slate-500">View transactions recorded for your organization.</p></header>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative w-full sm:w-auto"><span className="sr-only">Filter by date range</span><CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-700" /><select value={range} onChange={(event) => { setRange(event.target.value); setPage(1) }} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-10 pr-9 text-xs font-bold text-slate-700 sm:w-auto"><option value="">All time</option><option>Last 30 days</option><option>Last 90 days</option><option>This year</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-slate-500" /></label>
      <label className="relative w-full sm:w-auto"><span className="sr-only">Filter by payment status</span><CreditCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-700" /><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-10 pr-9 text-xs font-bold text-slate-700 sm:w-auto"><option value="">Status: All</option><option>Successful</option><option>Failed</option><option>Pending</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-slate-500" /></label></div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    <section aria-label="Transactions" className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-700 xl:grid xl:grid-cols-[144px_112px_112px_80px_96px_minmax(130px,1fr)_96px_96px]"><span>Transaction ID</span><span>Date</span><span>Plan</span><span>Credits</span><span>Amount</span><span>Payment Method</span><span>Status</span><span className="text-center">Invoice</span></div>
      {loading ? <RecruiterLoading label="Loading payment history…" /> : items.map((transaction) => <article key={transaction.id} className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 xl:grid-cols-[144px_112px_112px_80px_96px_minmax(130px,1fr)_96px_96px] xl:items-center"><div className="text-sm font-semibold text-slate-900">{transaction.id}</div><div className="text-sm text-slate-700"><MobileLabel>Date</MobileLabel>{formatDate(transaction.date)}</div><div className="text-sm font-semibold text-slate-700"><MobileLabel>Plan</MobileLabel>{transaction.plan}</div><div className="text-sm text-slate-700"><MobileLabel>Credits</MobileLabel>{transaction.credits}</div><div className="text-sm font-bold text-slate-900"><MobileLabel>Amount</MobileLabel>{formatAmount(transaction.amount, transaction.currency)}</div><div className="text-xs text-slate-500"><MobileLabel>Payment Method</MobileLabel>{transaction.method || '—'}</div><div><MobileLabel>Status</MobileLabel><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[transaction.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{transaction.status}</span></div><div className="xl:text-center">{transaction.invoiceAvailable ? <Link to={`/recruiter/payment-history/invoices/${encodeURIComponent(transaction.id)}`} className="text-xs font-bold text-blue-600 underline">View Invoice</Link> : <span className="text-xs text-slate-400">—</span>}</div></article>)}
      {!loading && !error && !items.length && <RecruiterEmpty>No transactions match the selected filters.</RecruiterEmpty>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>{pagination.total} transactions</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {pagination.page || page} of {pagination.totalPages || 1}</span><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
  </div>
}

function MobileLabel({ children }) { return <span className="mr-2 text-[10px] font-bold uppercase text-slate-400 xl:hidden">{children}</span> }
