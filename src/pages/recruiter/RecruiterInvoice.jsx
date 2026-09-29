import React, { useEffect, useState } from 'react'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

export default function RecruiterInvoice() {
  const { transactionId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    recruiterApi.getInvoice(transactionId).then((payload) => { if (active) setInvoice(payload?.data?.invoice || payload?.invoice || payload?.data || payload) }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [transactionId, reload])

  if (loading) return <RecruiterLoading label="Loading invoice…" />
  if (error) return <div className="mx-auto flex max-w-xl flex-col gap-4"><RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} /><Link to="/recruiter/payment-history" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Back to Payment History</Link></div>
  if (!invoice) return <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-slate-900">Invoice unavailable</h1><p className="mt-2 text-sm text-slate-500">No invoice is available for this transaction.</p><Link to="/recruiter/payment-history" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Back to Payment History</Link></div>

  const amount = (value) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: invoice.currency }).format(Number(value)) } catch { return `${value ?? '—'} ${invoice.currency || ''}` } }
  const billedTo = invoice.billedTo || {}
  const billedFrom = invoice.billedFrom || {}
  return <div className="mx-auto flex max-w-[800px] flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link to="/recruiter/payment-history" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Payment History</Link><span className="text-xs text-slate-500">Invoice {invoice.invoiceNumber || ''}</span></div>
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="text-xl font-extrabold text-slate-900">MedHire</div><div className="sm:text-right"><h1 className="text-2xl font-extrabold text-slate-900">INVOICE</h1><p className="mt-1 text-xs text-slate-500">Invoice #: {invoice.invoiceNumber || '—'}</p><p className="mt-1 text-xs text-slate-500">Date: {invoice.date ? new Date(invoice.date).toLocaleDateString() : '—'}</p></div></header>
      <div className="border-t border-slate-200" /><section className="grid gap-6 sm:grid-cols-2"><AddressBlock title="Billed To" details={billedTo} /><AddressBlock title="Billed From" details={billedFrom} /></section>
      <div className="overflow-hidden rounded-lg border border-slate-200">{(invoice.lineItems || []).map((item, index) => <div key={item.id || index} className="grid grid-cols-[minmax(0,1fr)_100px_100px] gap-3 border-b border-slate-100 p-3 text-sm last:border-0"><span>{item.description || item.name}</span><span className="text-right">{item.quantity ?? 1}</span><span className="text-right">{amount(item.amount ?? item.total)}</span></div>)}</div>
      <dl className="ml-auto flex w-full max-w-sm flex-col gap-2.5"><Detail label="Subtotal" value={amount(invoice.subtotal)} /><Detail label="Tax" value={amount(invoice.tax)} /><Detail label="Total" value={amount(invoice.total)} strong /></dl>
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4"><h2 className="text-xs font-bold uppercase text-slate-500">Payment Details</h2><dl className="mt-3 flex flex-col gap-2"><Detail label="Transaction ID" value={invoice.transactionId || transactionId} /><Detail label="Method" value={invoice.paymentMethod || '—'} /><Detail label="Status" value={invoice.status || '—'} /></dl></section>
      <div className="flex flex-col gap-3 sm:flex-row print:hidden">{invoice.downloadUrl ? <a href={invoice.downloadUrl} target="_blank" rel="noreferrer" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white"><Download className="h-4 w-4" />Download Invoice PDF</a> : <button type="button" onClick={() => window.print()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white"><Download className="h-4 w-4" />Save as PDF</button>}<button type="button" onClick={() => window.print()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"><Printer className="h-4 w-4" />Print</button></div>
    </article>
  </div>
}

function AddressBlock({ title, details }) { return <div><h2 className="text-xs font-bold uppercase text-slate-400">{title}</h2><p className="mt-2 text-sm font-semibold text-slate-900">{details.name || details.organizationName || '—'}</p>{[details.contactName, details.email, details.address, details.city, details.taxId].filter(Boolean).map((line) => <p key={line} className="mt-1 text-xs text-slate-500">{line}</p>)}</div> }
function Detail({ label, value, strong = false }) { return <div className="flex items-start justify-between gap-3 text-xs"><dt className={strong ? 'font-bold text-slate-900' : 'text-slate-500'}>{label}</dt><dd className={`text-right ${strong ? 'text-base font-extrabold text-blue-600' : 'font-semibold text-slate-900'}`}>{value ?? '—'}</dd></div> }
