import React, { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, Search, ShoppingCart, UserRound, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'
import { getAuthenticatedUser } from '../../lib/authSession'

const metricIcons = [Search, Eye, UserRound, WalletCards]

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const user = getAuthenticatedUser()

  useEffect(() => {
    let current = true
    setLoading(true)
    recruiterApi.getDashboard().then((payload) => {
      if (current) setDashboard(payload?.data || payload)
    }).catch((requestError) => {
      if (current) setError(requestError)
    }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [reload])

  const organization = dashboard?.organization || {}
  const metrics = dashboard?.metrics || {}
  const metricItems = [
    ['Candidate Searches', metrics.candidateSearches],
    ['Profiles Unlocked', metrics.profilesUnlocked],
    ['Shortlisted Candidates', metrics.shortlistedCandidates],
    ['Available Credits', metrics.availableCredits],
  ]
  const candidates = dashboard?.recommendedCandidates || []
  const activities = dashboard?.recentActivity || []

  return <div className="flex flex-col gap-5">
    <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}</h1><p className="mt-1 text-sm text-slate-500">Find and connect with verified healthcare professionals.</p></div>
      {organization.verificationStatus && <Badge tone="success" className="normal-case tracking-normal">{organization.verificationStatus}</Badge>}
    </section>
    <RecruiterApiError error={error} onRetry={() => { setError(null); setReload((value) => value + 1) }} />
    {loading ? <RecruiterLoading label="Loading your recruiter dashboard…" /> : dashboard && <>
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {metricItems.map(([label, value], index) => { const Icon = metricIcons[index]; return <article key={label} className="flex flex-col gap-3.5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"><div className="flex items-center justify-between text-xs font-semibold text-slate-500">{label}<Icon className="h-4 w-4 text-blue-600" /></div><div className="text-3xl font-extrabold text-slate-900">{value ?? '—'}</div></article> })}
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-base font-bold text-teal-800">{organization.initials || '—'}</div><div className="min-w-0 flex-1"><h2 className="text-base font-bold text-slate-900">{organization.name || 'Organization'}</h2><p className="mt-1 text-xs text-slate-500">{organization.location || ''}</p></div></section>
          <section><h2 className="mb-4 text-lg font-bold text-slate-900">Recommended Candidates</h2>{candidates.length ? <div className="flex flex-col gap-3">{candidates.map((candidate) => <article key={candidate.publicId || candidate.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">{candidate.initials || '—'}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900">{candidate.title}</h3><p className="mt-0.5 text-xs text-slate-500">{candidate.experience} · {candidate.location}</p><div className="mt-2 flex flex-wrap gap-1.5">{(candidate.tags || candidate.specialties || []).map((tag) => <span key={tag} className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tag}</span>)}</div></div><Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId || candidate.id)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />View Profile</Link></article>)}</div> : <RecruiterEmpty>No recommended candidates are available.</RecruiterEmpty>}</section>
        </div>
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-slate-900">Recent Activity</h2>{activities.length ? <ul className="mt-4 flex flex-col gap-4">{activities.map((item) => <li key={item.id} className="flex items-start gap-2.5 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" /><span className="flex-1 text-slate-800">{item.description}<span className="mt-0.5 block text-slate-400">{item.occurredAt ? new Date(item.occurredAt).toLocaleString() : ''}</span></span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No recent activity.</p>}</section>
          <section className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-500">Credit Balance</p><p className="text-3xl font-extrabold text-slate-900">{metrics.availableCredits ?? '—'} Credits</p><Link to="/recruiter/plans-credits" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"><ShoppingCart className="h-3.5 w-3.5" />View Plans<ArrowUpRight className="h-3.5 w-3.5" /></Link></section>
        </div>
      </div>
    </>}
    {!loading && !error && !dashboard && <RecruiterEmpty>Dashboard data is not available yet.</RecruiterEmpty>}
  </div>
}
