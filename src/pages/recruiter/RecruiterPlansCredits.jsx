import React, { useEffect, useState } from 'react'
import { Check, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const unwrap = (payload) => payload?.data || payload

export default function RecruiterPlansCredits() {
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    Promise.all([recruiterApi.getPlans(), recruiterApi.getCreditBalance()]).then(([planPayload, creditPayload]) => {
      if (!active) return
      const planData = unwrap(planPayload); const creditData = unwrap(creditPayload)
      setPlans(Array.isArray(planData?.plans) ? planData.plans : []); setCurrentPlan(planData?.currentPlan || null); setCredits(creditData || null)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  const formatPrice = (price, currency) => {
    if (price === undefined || price === null || !currency) return 'Price unavailable'
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(price)) } catch { return `${price} ${currency}` }
  }

  return <div className="flex flex-col gap-6">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Plans &amp; Credits</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Choose the Right Hiring Plan</h1><p className="mt-1 text-sm text-slate-500">Select a plan that fits your recruitment needs.</p></section><section aria-label="Available credit balance" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">Available Balance</p><p className="text-base font-extrabold text-slate-900">{credits?.available ?? '—'} Credits</p></section></div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    {loading ? <RecruiterLoading label="Loading plans and credit balance…" /> : plans.length ? <section aria-label="Available hiring plans" className="grid items-stretch gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-xl font-extrabold text-slate-900">{plan.name}</h2><p className="mt-2 text-3xl font-extrabold text-slate-900">{formatPrice(plan.price, plan.currency)}</p><p className="text-sm text-slate-500">{plan.billingInterval || 'One-time'}</p></div><div className="border-t border-slate-100" /><div className="flex flex-1 flex-col gap-3 text-sm text-slate-600"><p>{plan.credits ?? 0} candidate credits</p>{plan.jobPosts !== undefined && <p>{plan.jobPosts} job posts</p>}{plan.recruiterSeats !== undefined && <p>{plan.recruiterSeats} recruiter seats</p>}{plan.validityDays !== undefined && <p>{plan.validityDays}-day validity</p>}{(plan.features || []).map((feature) => <p key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-teal-600" />{feature}</p>)}</div><Link to={`/recruiter/plans-credits/checkout?plan=${encodeURIComponent(plan.id)}`} className="flex h-11 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700">Choose Plan</Link></article>)}</section> : !error && <RecruiterEmpty>No plans are currently available.</RecruiterEmpty>}
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-base font-extrabold text-slate-900">Your Plan</h2><span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">{currentPlan?.name || 'No active plan'}</span></div><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />Plan prices, benefits and credit balances are provided by the server.</p></section>
  </div>
}
