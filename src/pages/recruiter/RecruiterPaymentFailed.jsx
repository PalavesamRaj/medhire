import React, { useEffect, useState } from 'react'
import { CircleX, Clock3 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

export default function RecruiterPaymentFailed() {
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

  if (loading) return <RecruiterLoading label="Checking checkout status…" />
  const status = String(data?.status || data?.session?.status || '').toLowerCase()
  const providerMessage = data?.message || data?.failureReason
  return <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center py-5"><section className="flex w-full max-w-[580px] flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10" aria-labelledby="payment-failed-title">
    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>{status === 'pending' ? <Clock3 className="h-8 w-8" /> : <CircleX className="h-8 w-8" />}</div>
    <div className="text-center"><h1 id="payment-failed-title" className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{status === 'pending' ? 'Checkout Status Pending' : 'Checkout Not Completed'}</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">{providerMessage || 'The checkout was cancelled or did not complete. No credits are added unless the payment provider confirms payment.'}</p></div>
    {error && <RecruiterApiError error={error} />}
    <p className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">Session: {sessionId || 'Not provided'}{data?.transactionId ? ` · Transaction: ${data.transactionId}` : ''}</p>
    <div className="flex w-full flex-col gap-3 sm:flex-row"><Link to="/recruiter/plans-credits" className="flex h-11 flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white">View Plans</Link><Link to="/recruiter/payment-history" className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700">Payment History</Link></div>
  </section></div>
}
