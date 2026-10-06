import React, { useEffect, useState } from 'react'
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const unwrap = (payload) => payload?.data || payload

export default function RecruiterCheckout() {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    recruiterApi.getPlans().then((payload) => {
      if (!active) return
      const data = unwrap(payload)
      setPlan((data?.plans || []).find((item) => item.id === planId) || null)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [planId])

  const startCheckout = async () => {
    setSubmitting(true); setError(null)
    try {
      const appBase = window.location.origin
      const response = unwrap(await recruiterApi.createCheckout({
        planId,
        successUrl: `${appBase}/recruiter/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appBase}/recruiter/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
      }))
      const checkoutUrl = new URL(response?.checkoutUrl)
      if (checkoutUrl.protocol !== 'https:') throw new Error('The payment provider returned an invalid checkout URL.')
      window.location.assign(checkoutUrl.toString())
    } catch (requestError) { setError(requestError) } finally { setSubmitting(false) }
  }

  if (loading) return <RecruiterLoading label="Loading plan details…" />
  if (!plan && !error) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-slate-900">Plan unavailable</h1><p className="mt-2 text-sm text-slate-500">Choose a plan currently offered by your organization.</p><Link to="/recruiter/plans-credits" className="mt-5 inline-flex text-sm font-semibold text-blue-600">Back to Plans &amp; Credits</Link></div>

  return <div className="mx-auto flex w-full max-w-2xl flex-col gap-6"><header><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Checkout</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Review Your Purchase</h1><p className="mt-1 text-sm text-slate-500">You will continue to the secure payment provider to complete payment.</p></header>
    <RecruiterApiError error={error} />
    {plan && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-lg font-extrabold text-slate-900">Order Summary</h2><dl className="mt-5 space-y-4 border-y border-slate-100 py-5"><SummaryRow label="Plan" value={plan.name} /><SummaryRow label="Credits" value={`${plan.credits ?? '—'}`} /><SummaryRow label="Billing interval" value={plan.billingInterval || '—'} /><SummaryRow label="Plan price" value={formatPrice(plan.price, plan.currency)} /></dl><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />Card details are collected by the payment provider and are not sent to MedHire.</p><button type="button" onClick={startCheckout} disabled={submitting} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><LockKeyhole className="h-4 w-4" />{submitting ? 'Opening secure checkout…' : 'Continue to Secure Checkout'}</button><Link to="/recruiter/plans-credits" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-600"><ArrowLeft className="h-3.5 w-3.5" />Back to Plans &amp; Credits</Link></section>}
  </div>
}

function formatPrice(amount, currency) {
  if (amount === undefined || amount === null || !currency) return 'Price unavailable'
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount)) } catch { return `${amount} ${currency}` }
}

function SummaryRow({ label, value }) { return <div className="flex justify-between gap-4 text-sm"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div> }
