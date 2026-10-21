import React, { useEffect, useState } from 'react'
import { ArrowRight, Bookmark, Check, Eye, Search, ShieldCheck, ShoppingCart, UserRound, WalletCards } from 'lucide-react'
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

function cleanText(value) {
  const text = String(value ?? '').trim()
  return /^[.\-_–—]+$/.test(text) ? '' : text
}

function toList(value) {
  if (Array.isArray(value)) return value.filter(item => item != null && String(item).trim()).map(item => typeof item === 'string' ? item : item.name ?? item.label ?? item.value).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return value.split(',').map(item => item.trim()).filter(Boolean)
  return []
}

function initialsFor(name) {
  return String(name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function relativeTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

function normalizeDashboard(payload, supplemental = {}) {
  const root = unwrap(payload) ?? {}
  const sources = [root.metrics, root.stats, root.summary, root.counts, root.analytics, root]
  const org = root.organization ?? root.hospital ?? root.company ?? root.organizationProfile ?? root.organizationDetails ?? root.organization_details ?? {}
  const address = org.address ?? org.locationDetails ?? (typeof org.location === 'object' ? org.location : {})
  const organizationName = cleanText(org.name ?? org.organizationName ?? org.organization_name ?? org.companyName ?? org.company_name ?? org.hospitalName ?? root.organizationName ?? root.organization_name)
  const location = typeof org.location === 'string' ? org.location : [org.city ?? org.city_name ?? address.city, org.state ?? org.state_name ?? address.state ?? address.region].filter(Boolean).join(', ')
  const candidates = root.recommendedCandidates ?? root.recommended_candidates ?? root.recommendations ?? root.candidates ?? root.suggestedCandidates ?? root.suggested_candidates ?? []
  const activities = root.recentActivity ?? root.recent_activity ?? root.recentActivities ?? root.recent_activities ?? root.activities ?? root.activity ?? []
  const creditPayload = unwrap(supplemental.credits) ?? {}
  const creditSources = [creditPayload.balance, creditPayload.credits, creditPayload.summary, creditPayload]
  const creditValue = firstValue(creditSources, ['availableCredits', 'creditsAvailable', 'creditBalance', 'remainingCredits', 'balance', 'available', 'totalCredits'])
  const nestedCreditValue = typeof creditValue === 'object' ? firstValue([creditValue], ['available', 'balance', 'remaining', 'amount', 'credits']) : creditValue
  const metrics = {
    candidateSearches: firstValue(sources, ['candidateSearches', 'candidate_searches', 'searches', 'searchCount', 'search_count', 'totalSearches', 'total_searches']),
    profilesUnlocked: firstValue(sources, ['profilesUnlocked', 'profiles_unlocked', 'unlockedProfiles', 'unlocked_profiles', 'totalProfilesUnlocked', 'totalUnlocks', 'total_unlocks', 'unlockCount']) ?? supplemental.purchasedTotal,
    shortlistedCandidates: firstValue(sources, ['shortlistedCandidates', 'shortlisted_candidates', 'shortlistedCount', 'shortlisted_count', 'totalShortlistedCandidates', 'totalShortlisted', 'shortlistCount']) ?? supplemental.shortlistedTotal,
    availableCredits: firstValue(sources, ['availableCredits', 'available_credits', 'creditsAvailable', 'creditBalance', 'credit_balance', 'remainingCredits', 'remaining_credits']) ?? (typeof nestedCreditValue === 'number' || typeof nestedCreditValue === 'string' ? nestedCreditValue : undefined),
    usedCredits: firstValue(creditSources, ['usedCredits', 'creditsUsed', 'used', 'consumedCredits']),
    totalCredits: firstValue(creditSources, ['totalCredits', 'creditLimit', 'purchasedCredits', 'allocatedCredits']),
  }
  const normalizedCandidates = (Array.isArray(candidates) ? candidates : candidates?.items ?? candidates?.results ?? []).map((candidate, index) => {
    const id = candidate.candidateId ?? candidate.candidate_id ?? candidate.publicId ?? candidate.public_id ?? candidate.id ?? candidate.userId ?? candidate._id
    const title = cleanText(candidate.currentJobTitle ?? candidate.current_job_title ?? candidate.professionalTitle ?? candidate.professional_title ?? candidate.roleTitle ?? candidate.role_title ?? candidate.title ?? candidate.headline ?? candidate.fullName ?? candidate.full_name ?? candidate.name)
    const candidateName = cleanText(candidate.fullName ?? candidate.full_name ?? candidate.candidateName ?? candidate.candidate_name ?? candidate.name ?? candidate.displayName ?? candidate.display_name)
    const specialty = candidate.specialty ?? candidate.specialties ?? candidate.specialty_name ?? candidate.skills ?? candidate.tags ?? []
    const candidateLocation = typeof candidate.location === 'object'
      ? [candidate.location.city, candidate.location.state].filter(Boolean).join(', ')
      : candidate.location ?? [candidate.city ?? candidate.city_name, candidate.state ?? candidate.state_name].filter(Boolean).join(', ')
    const experience = candidate.yearsOfExperience ?? candidate.years_of_experience ?? candidate.experienceYears ?? candidate.experience
    const openToWork = candidate.openToWork ?? candidate.open_to_work
    return {
      ...candidate,
      id: id == null ? `recommended-${index}` : String(id),
      publicId: id == null ? '' : String(id),
      title: title || 'Healthcare professional',
      initials: candidate.initials || initialsFor(candidateName || title) || 'MH',
      experience: experience == null ? '' : typeof experience === 'number' ? `${experience} year${experience === 1 ? '' : 's'} experience` : String(experience),
      location: cleanText(candidateLocation),
      tags: toList(specialty),
      openToWork: Boolean(openToWork),
      unlocked: Boolean(candidate.unlocked ?? candidate.isUnlocked ?? candidate.is_unlocked),
      verifiedCredentials: Boolean(candidate.verifiedCredentials ?? candidate.verified_credentials ?? candidate.credentialsVerified ?? candidate.credentials_verified),
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
  }).filter(item => item.description && !/^[.\-_–—]+$/.test(item.description))

  return {
    ...root,
    organization: { ...org, name: organizationName, location: cleanText(location), initials: org.initials || initialsFor(organizationName), verificationStatus: org.verificationStatus ?? org.organizationVerificationStatus ?? org.organization_verification_status ?? org.status },
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

function statusLabel(status) {
  const value = String(status ?? '').replaceAll('_', ' ').trim()
  if (!value) return ''
  if (/verified|approved|active/i.test(value)) return 'Verified Hospital'
  return value.replace(/\b\w/g, letter => letter.toUpperCase())
}

function statusTone(status) {
  if (/verified|approved|active/i.test(String(status ?? ''))) return 'success'
  if (/reject|suspend|blocked/i.test(String(status ?? ''))) return 'error'
  return 'warning'
}

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [shortlisting, setShortlisting] = useState('')
  const [shortlistedIds, setShortlistedIds] = useState(new Set())
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
      const normalized = normalizeDashboard(dashboardResult.value, {
        credits: creditResult.status === 'fulfilled' ? creditResult.value : null,
        shortlistedTotal: shortlistResult.status === 'fulfilled' ? responseTotal(shortlistResult.value) : undefined,
        purchasedTotal: purchasedResult.status === 'fulfilled' ? responseTotal(purchasedResult.value) : undefined,
      })
      setDashboard(normalized)
      const existing = normalized.recommendedCandidates.filter(candidate => candidate.shortlisted ?? candidate.isShortlisted ?? candidate.is_shortlisted).map(candidate => candidate.publicId).filter(Boolean)
      setShortlistedIds(new Set(existing))
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
  const totalCredits = Number(metrics.totalCredits)
  const usedCredits = Number(metrics.usedCredits)
  const creditProgress = Number.isFinite(totalCredits) && totalCredits > 0 && Number.isFinite(usedCredits)
    ? Math.max(0, Math.min(100, (usedCredits / totalCredits) * 100))
    : 0

  async function handleShortlist(candidateId) {
    if (!candidateId || shortlisting) return
    setShortlisting(candidateId)
    try {
      await recruiterApi.addShortlistedCandidate(candidateId)
      setShortlistedIds(previous => new Set([...previous, candidateId]))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setShortlisting('')
    }
  }

  return <div className="flex flex-col gap-5">
    <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}</h1>
        <p className="mt-1 text-sm text-slate-500">Find and connect with verified healthcare professionals.</p>
      </div>
      {organization.verificationStatus && <Badge tone={statusTone(organization.verificationStatus)} className="normal-case tracking-normal">{statusLabel(organization.verificationStatus)}</Badge>}
    </section>

    <RecruiterApiError error={error} onRetry={() => { setError(null); setReload(value => value + 1) }} />
    {loading ? <RecruiterLoading label="Loading your recruiter dashboard…" /> : dashboard && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricItems.map(([label, value], index) => {
          const Icon = metricIcons[index]
          return <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500"><span>{label}</span><Icon className="h-4 w-4 shrink-0 text-blue-600" /></div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{value ?? '—'}</div>
          </article>
        })}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(290px,3fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{organization.initials || '—'}</div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-900">{organization.name || 'Organization'}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{[user?.fullName, organization.location].filter(Boolean).join(' · ') || 'Organization details unavailable'}</p>
            </div>
            {organization.verificationStatus && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700"><ShieldCheck className="h-3 w-3" />{statusLabel(organization.verificationStatus)}</span>}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">Recommended Candidates</h2><Link to="/recruiter/find-candidates" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Find candidates <ArrowRight className="ml-1 inline h-3 w-3" /></Link></div>
            {candidates.length ? <div className="flex flex-col gap-3">
              {candidates.map(candidate => {
                const isShortlisted = shortlistedIds.has(candidate.publicId)
                return <article key={candidate.publicId || candidate.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{candidate.initials || 'MH'}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{candidate.title}</h3>
                      {candidate.verifiedCredentials && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">Verified Credentials</span>}
                      {candidate.unlocked && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Unlocked</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{[candidate.experience, candidate.location, candidate.openToWork ? 'Avail: Open to work' : ''].filter(Boolean).join('  ·  ') || 'Candidate details unavailable'}</p>
                    {candidate.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{candidate.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{tag}</span>)}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {candidate.publicId ? <Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId)}`} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-[11px] font-bold text-white hover:bg-blue-700"><Eye className="h-3 w-3" />View Profile</Link> : <span className="text-[11px] text-slate-400">Profile unavailable</span>}
                    <button type="button" onClick={() => handleShortlist(candidate.publicId)} disabled={!candidate.publicId || isShortlisted || shortlisting === candidate.publicId} aria-label={isShortlisted ? 'Candidate shortlisted' : 'Shortlist candidate'} title={isShortlisted ? 'Shortlisted' : 'Shortlist candidate'} className={`flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-default ${isShortlisted ? 'text-blue-600' : 'text-slate-500'}`}>
                      {isShortlisted ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </article>
              })}
            </div> : <RecruiterEmpty>No recommended candidates are available.</RecruiterEmpty>}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            {activities.length ? <ul className="mt-4 flex flex-col gap-3.5">{activities.map(item => <li key={item.id} className="flex items-start gap-2.5 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" /><span className="min-w-0 flex-1 text-slate-800">{item.description}<span className="mt-1 block text-[10px] text-slate-400">{relativeTime(item.occurredAt)}</span></span></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No recent activity.</p>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
            <p className="text-xs font-semibold text-slate-500">Credit Balance</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.availableCredits ?? '—'} Credits</p>
            {totalCredits > 0 && <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${creditProgress}%` }} /></div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-400"><span>{metrics.availableCredits ?? '—'} Available</span><span>{Number.isFinite(usedCredits) ? usedCredits : '—'} Used</span></div>
            </>}
            <Link to="/recruiter/plans-credits" className="mt-3 flex h-8 items-center justify-center gap-2 rounded-md bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-700"><ShoppingCart className="h-3 w-3" />Buy Credits</Link>
          </section>
        </div>
      </div>
    </>}
    {!loading && !error && !dashboard && <RecruiterEmpty>Dashboard data is not available yet.</RecruiterEmpty>}
  </div>
}
