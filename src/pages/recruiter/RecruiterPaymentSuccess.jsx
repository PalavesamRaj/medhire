import React, { useEffect, useState } from 'react'
import { Check, Clock3, FileText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

export default function RecruiterPaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    let active = true
    recruiterApi.getCheckoutSession(sessionId).then((payload) => { if (active) setData(payload?.data || payload) }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [sessionId])

  if (loading) return <RecruiterLoading label="Confirming payment with the provider…" />
  const status = String(data?.status || data?.session?.status || '').toLowerCase()
  const paid = ['successful', 'succeeded', 'paid', 'complete', 'completed'].includes(status)
  const transactionId = data?.transactionId || data?.transaction?.id
  return <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center py-5"><section className="flex w-full max-w-[580px] flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10" aria-labelledby="payment-result-title">
    {error ? <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock3 className="h-8 w-8" /></div> : <div className={`flex h-16 w-16 items-center justify-center rounded-full ${paid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{paid ? <Check className="h-8 w-8" strokeWidth={3} /> : <Clock3 className="h-8 w-8" />}</div>}
    <div className="text-center"><h1 id="payment-result-title" className="text-2xl font-extrabold text-slate-900">{error ? 'Payment Status Unavailable' : paid ? 'Payment Confirmed' : 'Payment Confirmation Pending'}</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">{error ? error.message : paid ? 'The payment provider confirmed this transaction.' : sessionId ? 'The provider has returned, but the payment has not yet been confirmed. Credits are applied only after server verification.' : 'A payment session is required to verify this transaction.'}</p></div>
    {transactionId && <p className="text-sm text-slate-600">Transaction: <strong>{transactionId}</strong></p>}
    {!paid && <p className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">No payment success or credit grant is inferred from this browser redirect.</p>}
    <div className="flex w-full flex-col gap-3 sm:flex-row">{paid && transactionId && <Link to={`/recruiter/payment-history/invoices/${encodeURIComponent(transactionId)}`} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"><FileText className="h-4 w-4" />View Invoice</Link>}<Link to="/recruiter/payment-history" className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 text-sm font-bold text-slate-700">Payment History</Link><Link to="/recruiter/find-candidates" className="flex h-11 flex-1 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">Find Candidates</Link></div>
  </section></div>
}
