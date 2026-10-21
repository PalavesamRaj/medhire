import React, { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, Search, ShoppingCart, UserRound, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'
import { getAuthenticatedUser } from '../../lib/authSession'

const metricIcons = [Search, Eye, UserRound, WalletCards]

function unwrap(value) {
  let current = value
  for (let index = 0; index < 3 && current && !Array.isArray(current) && current.data && typeof current.data === 'object'; index += 1) current = current.data
  return current?.dashboard ?? current
}

function firstValue(sources, keys) {
  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
  }
  return undefined
}

function formatName(value) {
  const text = String(value ?? '').trim()
  return /^[.\-–—_]+$/.test(text) ? '' : text
}

function toList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function initialsFor(name) {
  return String(name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function normalizeDashboard(payload, supplemental = {}) {
  const root = unwrap(payload) ?? {}
  const sources = [root.metrics, root.stats, root.summary, root.counts, root.analytics, root]
  const org = root.organization ?? root.hospital ?? root.company ?? root.organizationProfile ?? root.organizationDetails ?? root.organization_details ?? {}
  const address = org.address ?? org.locationDetails ?? (typeof org.location === 'object' ? org.location : {})
  const organizationName = formatName(org.name ?? org.organizationName ?? org.organization_name ?? org.companyName ?? org.company_name ?? org.hospitalName ?? root.organizationName ?? root.organization_name)
  const location = typeof org.location === 'string' ? org.location : [org.city ?? org.city_name ?? address.city, org.state ?? org.state_name ?? address.state ?? address.region].filter(Boolean).join(', ')
  const candidates = root.recommendedCandidates ?? root.recommended_candidates ?? root.recommendations ?? root.candidates ?? root.suggestedCandidates ?? root.suggested_candidates ?? []
  const activities = root.recentActivity ?? root.recent_activity ?? root.recentActivities ?? root.recent_activities ?? root.activities ?? root.activity ?? []
  const creditsPayload = unwrap(supplemental.credits) ?? {}
  const creditSources = [creditsPayload.balance, creditsPayload.credits, creditsPayload.summary, creditsPayload]
  const creditValue = firstValue(creditSources, ['availableCredits', 'creditsAvailable', 'creditBalance', 'remainingCredits', 'balance', 'available', 'totalCredits'])
  const nestedCreditValue = typeof creditValue === 'object' ? firstValue([creditValue], ['available', 'balance', 'remaining', 'amount', 'credits']) : creditValue
  const metrics = {
    candidateSearches: firstValue(sources, ['candidateSearches', 'candidate_searches', 'candidateSearchCount', 'candidate_search_count', 'candidateSearchesCount', 'totalCandidateSearches', 'total_candidate_searches', 'searchCount', 'search_count', 'totalSearches', 'total_searches', 'searchesMade', 'candidatesSearched']),
    profilesUnlocked: firstValue(sources, ['profilesUnlocked', 'profiles_unlocked', 'unlockedProfiles', 'unlocked_profiles', 'totalProfilesUnlocked', 'totalUnlockedProfiles', 'unlockedCandidates', 'totalUnlocks', 'total_unlocks', 'unlockCount']) ?? supplemental.purchasedTotal,
    shortlistedCandidates: firstValue(sources, ['shortlistedCandidates', 'shortlisted_candidates', 'shortlistedCount', 'shortlisted_count', 'totalShortlistedCandidates', 'totalShortlisted', 'shortlistCount']) ?? supplemental.shortlistedTotal,
    availableCredits: firstValue(sources, ['availableCredits', 'available_credits', 'creditsAvailable', 'creditBalance', 'credit_balance', 'remainingCredits', 'remaining_credits']) ?? (typeof nestedCreditValue === 'number' || typeof nestedCreditValue === 'string' ? nestedCreditValue : undefined),
  }
  const normalizedCandidates = (Array.isArray(candidates) ? candidates : candidates?.items ?? candidates?.results ?? []).map((candidate, index) => {
    const name = formatName(candidate.fullName ?? candidate.full_name ?? candidate.candidateName ?? candidate.candidate_name ?? candidate.name ?? candidate.displayName ?? candidate.display_name)
      || formatName([candidate.firstName ?? candidate.first_name, candidate.lastName ?? candidate.last_name].filter(Boolean).join(' '))
      || formatName(candidate.title ?? candidate.roleTitle ?? candidate.role_title ?? candidate.headline)
    const id = candidate.publicId ?? candidate.public_id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.id ?? candidate.userId ?? candidate._id
    const specialty = candidate.specialties ?? candidate.specialty ?? candidate.specialty_name ?? candidate.skills ?? candidate.tags ?? []
    const candidateLocation = typeof candidate.location === 'object'
      ? [candidate.location.city, candidate.location.state].filter(Boolean).join(', ')
      : candidate.location ?? [candidate.city ?? candidate.city_name, candidate.state ?? candidate.state_name].filter(Boolean).join(', ')
    const experience = candidate.experience ?? candidate.yearsOfExperience ?? candidate.years_of_experience ?? candidate.experienceYears
    return {
      ...candidate,
      id: id == null ? `recommended-${index}` : String(id),
      publicId: candidate.publicId ?? candidate.public_id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.id ?? candidate.userId ?? candidate._id,
      title: name || 'Candidate profile',
      initials: candidate.initials || initialsFor(name) || '—',
      experience: experience == null ? '' : typeof experience === 'number' ? `${experience} years experience` : String(experience),
      location: candidateLocation || '',
      tags: toList(specialty),
    }
  })
  const normalizedActivities = (Array.isArray(activities) ? activities : activities?.items ?? activities?.results ?? []).map((item, index) => {
    const description = typeof item === 'string' ? item : item.description ?? item.message ?? item.text ?? item.title ?? item.action ?? item.event ?? item.activity ?? item.type
    return {
      ...((typeof item === 'object' && item) ? item : {}),
      id: item?.id ?? item?._id ?? `activity-${index}`,
      description: String(description ?? '').replaceAll('_', ' ').trim(),
      occurredAt: item?.occurredAt ?? item?.occurred_at ?? item?.createdAt ?? item?.created_at ?? item?.timestamp ?? item?.date ?? '',
    }
  }).filter(item => item.description && !/^[.\-–—_]+$/.test(item.description))

  return {
    ...root,
    organization: { ...org, name: organizationName, location, initials: org.initials || initialsFor(organizationName), verificationStatus: org.verificationStatus ?? org.organizationVerificationStatus ?? org.status },
    metrics,
    recommendedCandidates: normalizedCandidates,
    recentActivity: normalizedActivities,
  }
}

function responseTotal(payload) {
  const root = unwrap(payload) ?? {}
  const pagination = payload?.pagination ?? payload?.data?.pagination ?? root.pagination ?? {}
  const value = pagination.total ?? root.total ?? root.totalCount ?? root.count
  return value == null ? undefined : Number(value)
}

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const user = getAuthenticatedUser()

  useEffect(() => {
    let current = true
    setLoading(true)
    Promise.allSettled([
      recruiterApi.getDashboard(),
      recruiterApi.getCreditBalance(),
      recruiterApi.getShortlistedCandidates({ page: 1, pageSize: 1 }),
      recruiterApi.getPurchasedCandidates({ page: 1, pageSize: 1 }),
    ]).then(([dashboardResult, creditResult, shortlistResult, purchasedResult]) => {
      if (!current) return
      if (dashboardResult.status === 'rejected') {
        setError(dashboardResult.reason)
        return
      }
      setError(null)
      setDashboard(normalizeDashboard(dashboardResult.value, {
        credits: creditResult.status === 'fulfilled' ? creditResult.value : null,
        shortlistedTotal: shortlistResult.status === 'fulfilled' ? responseTotal(shortlistResult.value) : undefined,
        purchasedTotal: purchasedResult.status === 'fulfilled' ? responseTotal(purchasedResult.value) : undefined,
      }))
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
      <section><h2 className="mb-4 text-lg font-bold text-slate-900">Recommended Candidates</h2>{candidates.length ? <div className="flex flex-col gap-3">{candidates.map((candidate) => <article key={candidate.publicId || candidate.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">{candidate.initials || '—'}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900">{candidate.title}</h3>{(candidate.experience || candidate.location) && <p className="mt-0.5 text-xs text-slate-500">{[candidate.experience, candidate.location].filter(Boolean).join(' · ')}</p>}<div className="mt-2 flex flex-wrap gap-1.5">{(candidate.tags || candidate.specialties || []).map((tag) => <span key={tag} className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tag}</span>)}</div></div>{candidate.publicId ? <Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />View Profile</Link> : <span className="text-xs text-slate-400">Profile ID unavailable</span>}</article>)}</div> : <RecruiterEmpty>No recommended candidates are available.</RecruiterEmpty>}</section>
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
