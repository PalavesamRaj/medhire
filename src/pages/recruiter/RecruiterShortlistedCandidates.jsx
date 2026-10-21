import React, { useEffect, useMemo, useState } from 'react'
import { Eye, LockKeyhole, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import RecruiterRejectApplicationDialog from '../../components/recruiter/RecruiterRejectApplicationDialog'
import { recruiterApi } from '../../lib/recruiterApi'

function normalizeShortlistedCandidate(item = {}) {
  const candidate = item.candidate || item.profile || item.candidateProfile || item.candidate_profile || item.candidateDetails || item.candidate_details || item
  const candidateId = item.candidateId || item.candidate_id || candidate.candidateId || candidate.candidate_id || candidate.id
  const publicId = item.publicId || item.public_id || item.candidatePublicId || item.candidate_public_id || candidate.publicId || candidate.public_id
  const id = candidateId || publicId || item.id
  const fromApplication = item.fromApplication === true
  const unlockedValue = item.unlocked ?? item.isUnlocked ?? item.is_unlocked ?? candidate.unlocked ?? candidate.isUnlocked ?? candidate.is_unlocked
  const unlocked = unlockedValue === true || String(item.unlockStatus || item.unlock_status || candidate.unlockStatus || candidate.unlock_status || '').toLowerCase() === 'unlocked'
  const name = fromApplication && !unlocked
    ? candidate.maskedName || candidate.masked_name || candidate.maskedFullName || candidate.masked_full_name || item.maskedName || item.masked_name
    : candidate.name || candidate.fullName || candidate.full_name || candidate.displayName || candidate.display_name || item.candidateName || item.candidate_name || item.fullName || item.full_name || item.name
  const city = candidate.city || candidate.cityName || candidate.city_name || item.city || item.city_name
  const state = candidate.state || candidate.stateName || candidate.state_name || item.state || item.state_name
  const location = candidate.location || candidate.locationName || candidate.location_name || item.location || item.location_name || [city, state].filter(Boolean).join(', ')
  const experienceValue = candidate.experience ?? item.experience ?? candidate.yearsOfExperience ?? candidate.years_of_experience ?? item.yearsOfExperience ?? item.years_of_experience
  const experience = typeof experienceValue === 'number' ? `${experienceValue} years` : experienceValue
  const rawStatus = item.unlockStatus || item.unlock_status || candidate.unlockStatus || candidate.unlock_status || candidate.status
  const statusText = rawStatus ? String(rawStatus).toLowerCase().replaceAll('_', ' ') : ''
  const status = /lock/.test(statusText) ? (statusText.includes('unlocked') ? 'Unlocked' : 'Locked') :
    (statusText ? statusText.replace(/\b\w/g, (letter) => letter.toUpperCase()) : unlockedValue === true ? 'Unlocked' : unlockedValue === false ? 'Locked' : 'Status unavailable')

  return {
    ...item,
    ...candidate,
    id,
    candidateId,
    publicId,
    name,
    initials: candidate.initials || item.initials || (name ? name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : undefined),
    title: candidate.title || candidate.role || candidate.professionalTitle || candidate.professional_title || candidate.currentJobTitle || candidate.current_job_title || candidate.jobTitle || candidate.job_title || item.title || item.role || item.professionalTitle || item.professional_title,
    specialty: candidate.specialty || candidate.primarySpecialty || candidate.primary_specialty || item.specialty || item.primarySpecialty || item.primary_specialty,
    experience,
    location,
    status,
    applicationStatus: item.applicationStatus || item.application_status || (fromApplication ? item.status : ''),
    applicationId: item.applicationId || item.application_id,
    jobId: item.jobId || item.job_id,
    jobTitle: item.jobTitle || item.job_title || item.job?.title || '',
    fromApplication,
    date: item.appliedAt || item.applied_at || item.shortlistedAt || item.shortlisted_at || item.savedAt || item.saved_at || item.createdAt || item.created_at || candidate.shortlistedAt || candidate.shortlisted_at || item.date,
  }
}

function unwrapCandidate(payload) {
  let result = payload
  for (let depth = 0; depth < 5 && result && !Array.isArray(result); depth += 1) {
    if (result.data && typeof result.data === 'object') result = result.data
    else if (result.result && typeof result.result === 'object') result = result.result
    else break
  }
  return result?.candidate ?? result?.candidateProfile ?? result?.candidate_profile ?? result?.profile?.candidate ?? result?.profile ?? result ?? {}
}

function statusKey(value) { return String(value || '').toUpperCase().replaceAll(' ', '_') }

export default function RecruiterShortlistedCandidates() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [reload, setReload] = useState(0)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const loadCandidates = async () => {
      try {
        // Keep saved candidates and application shortlists together in this view.
        const savedPromise = recruiterApi.getShortlistedCandidates()
        const jobsPromise = recruiterApi.getJobs()
        const [savedResult, jobsResult] = await Promise.allSettled([savedPromise, jobsPromise])
        if (savedResult.status === 'rejected') throw savedResult.reason
        const saved = getListResponse(savedResult.value).items.map(normalizeShortlistedCandidate)
        let applicationRows = []
        let applicationLoadError = jobsResult.status === 'rejected' ? jobsResult.reason : null
        if (jobsResult.status === 'fulfilled') {
          const jobs = getListResponse(jobsResult.value).items
          const perJob = await Promise.all(jobs.map(async (job) => {
            const jobId = job.id || job.jobId || job.job_id
            if (!jobId) return []
            try {
              const applications = getListResponse(await recruiterApi.getJobApplications(jobId)).items
              return applications.filter((application) => statusKey(application.status || application.applicationStatus || application.application_status) === 'SHORTLISTED')
                .map((application) => normalizeShortlistedCandidate({ ...application, jobId, jobTitle: job.title || job.jobTitle || job.job_title || 'Job posting', fromApplication: true }))
            } catch (requestError) {
              applicationLoadError ||= requestError
              return []
            }
          }))
          applicationRows = perJob.flat()
          applicationRows = await Promise.all(applicationRows.map(async (row) => {
            if (!row.candidateId || (row.title && row.specialty && row.location)) return row
            try {
              const candidate = unwrapCandidate(await recruiterApi.getCandidate(row.publicId || row.candidateId))
              return normalizeShortlistedCandidate({ ...row, candidate: { ...candidate, id: row.candidateId } })
            } catch {
              return row
            }
          }))
        }
        if (!active) return
        const merged = [...saved, ...applicationRows]
        const unique = new Map()
        merged.forEach((candidate, index) => {
          const key = candidate.applicationId ? `application:${candidate.applicationId}` : `saved:${candidate.candidateId || candidate.id || index}`
          unique.set(key, candidate)
        })
        setItems([...unique.values()])
        if (applicationLoadError) setError(applicationLoadError)
      } catch (requestError) {
        if (active) setError(requestError)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadCandidates()
    return () => { active = false }
  }, [reload])

  const filteredItems = useMemo(() => items.filter((candidate) => {
    const text = [candidate.name, candidate.title, candidate.specialty, candidate.location, candidate.status].filter(Boolean).join(' ').toLowerCase()
    return (!query || text.includes(query.trim().toLowerCase())) &&
      (!specialty || String(candidate.specialty || '').toLowerCase().includes(specialty.trim().toLowerCase())) &&
      (!location || String(candidate.location || '').toLowerCase().includes(location.trim().toLowerCase()))
  }), [items, query, specialty, location])
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  const remove = async (candidate) => {
    if (!candidate.candidateId) return
    setRemovingId(candidate.id)
    setError(null)
    try {
      await recruiterApi.removeShortlistedCandidate(candidate.candidateId)
      setItems((current) => current.filter((item) => item.id !== candidate.id))
    } catch (requestError) { setError(requestError) }
    finally { setRemovingId(null) }
  }
  const advanceApplication = async (candidate, nextStatus, reason = '') => {
    if (!candidate.applicationId || !candidate.fromApplication) return false
    setStatusUpdatingId(candidate.applicationId)
    setError(null)
    try {
      await recruiterApi.updateApplicationStatus(candidate.applicationId, nextStatus, reason)
      setItems((current) => current.filter((item) => item.applicationId !== candidate.applicationId))
      return true
    } catch (requestError) {
      setError(requestError)
      return false
    } finally {
      setStatusUpdatingId(null)
    }
  }
  const confirmRejection = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    const saved = await advanceApplication(rejectTarget, 'REJECTED', rejectReason.trim())
    if (saved) { setRejectTarget(null); setRejectReason('') }
  }
  const clearFilters = () => { setQuery(''); setSpecialty(''); setLocation(''); setPage(1) }
  const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Shortlisted Candidates</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Shortlisted Candidates</h1><p className="mt-1 text-sm text-slate-500">Candidates saved for later consideration by your team.</p></section>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block min-w-0 flex-1"><span className="sr-only">Search shortlisted candidates</span><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search shortlisted candidates..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
      <FilterInput value={specialty} onChange={(value) => { setSpecialty(value); setPage(1) }} placeholder="Specialty" />
      <FilterInput value={location} onChange={(value) => { setLocation(value); setPage(1) }} placeholder="Location" />
    </div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-700 xl:grid xl:grid-cols-[minmax(180px,1fr)_160px_112px_55px_120px_110px_90px_80px]"><span>Candidate</span><span>Role</span><span>Specialty</span><span>Exp</span><span>Location</span><span>Date</span><span>Status</span><span>Actions</span></div>
      {loading ? <RecruiterLoading label="Loading shortlisted candidates…" /> : pageItems.map((candidate, index) => <ShortlistedCandidateRow key={candidate.applicationId ? `application-${candidate.applicationId}` : candidate.id || index} candidate={candidate} removing={removingId === candidate.id} statusUpdating={statusUpdatingId === candidate.applicationId} onRemove={() => remove(candidate)} onAdvance={(nextStatus) => { if (nextStatus === 'REJECTED') { setError(null); setRejectTarget(candidate); setRejectReason('') } else advanceApplication(candidate, nextStatus) }} formatDate={formatDate} />)}
      {!loading && !error && !pageItems.length && <RecruiterEmpty>No shortlisted candidates match your filters.</RecruiterEmpty>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Showing {pageItems.length ? `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + pageItems.length}` : '0'} of {filteredItems.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
    {(query || specialty || location) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-blue-600">Clear Filters</button>}
    <RecruiterRejectApplicationDialog open={Boolean(rejectTarget)} candidateName={rejectTarget?.name || ''} jobTitle={rejectTarget?.jobTitle || ''} reason={rejectReason} onReasonChange={setRejectReason} onCancel={() => { if (!statusUpdatingId) { setRejectTarget(null); setRejectReason('') } }} onConfirm={confirmRejection} busy={Boolean(rejectTarget && statusUpdatingId === rejectTarget.applicationId)} error={error?.message || ''} />
  </div>
}

function ShortlistedCandidateRow({ candidate, removing, statusUpdating, onRemove, onAdvance, formatDate }) {
  const locked = candidate.status === 'Locked'
  const candidateLabel = candidate.name || 'Candidate profile'
  const profileId = candidate.publicId || candidate.candidateId || candidate.id
  return <article className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 xl:grid-cols-[minmax(180px,1fr)_160px_112px_55px_120px_110px_90px_minmax(80px,auto)] xl:items-center"><div className="flex items-center gap-2.5"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${locked ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>{candidate.initials || '—'}</div><div className="text-sm font-semibold text-slate-900">{candidateLabel}</div></div><div className="text-sm text-slate-600">{candidate.title || '—'}{candidate.jobTitle && <Link to={`/recruiter/jobs/${encodeURIComponent(candidate.jobId)}/applications`} className="mt-1 block text-xs font-semibold text-blue-600 hover:text-blue-700">Applied to: {candidate.jobTitle}</Link>}</div><div className="text-sm text-slate-600">{candidate.specialty || '—'}</div><div className="text-sm text-slate-600">{candidate.experience ?? '—'}</div><div className="text-sm text-slate-600">{candidate.location || '—'}</div><div className="text-xs text-slate-500">{formatDate(candidate.date)}</div><div>{candidate.applicationStatus ? <Badge tone="teal" className="normal-case tracking-normal">{String(candidate.applicationStatus).toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</Badge> : locked ? <Badge tone="slate" className="normal-case tracking-normal"><LockKeyhole className="mr-1 h-3 w-3" />Locked</Badge> : <Badge tone="success" className="normal-case tracking-normal">{candidate.status === 'Unlocked' ? 'Unlocked' : 'Status unavailable'}</Badge>}</div><div className="flex flex-wrap items-center gap-2">{profileId ? <Link to={`/recruiter/candidates/${encodeURIComponent(profileId)}`} aria-label={`View ${candidateLabel}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600"><Eye className="h-3.5 w-3.5" /></Link> : <button type="button" disabled aria-label="Candidate ID unavailable" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600 disabled:opacity-40"><Eye className="h-3.5 w-3.5" /></button>}{candidate.fromApplication && <select aria-label={`Move ${candidateLabel} to next step`} disabled={statusUpdating} defaultValue="" onChange={(event) => { const next = event.target.value; event.target.value = ''; if (next) onAdvance(next) }} className="h-8 max-w-36 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 disabled:opacity-50"><option value="" disabled>{statusUpdating ? 'Saving…' : 'Next step'}</option><option value="INTERVIEW">Move to Interview</option><option value="REJECTED">Move to Rejected</option></select>}{!candidate.fromApplication && <button type="button" disabled={!candidate.candidateId || removing} onClick={onRemove} aria-label={`Remove ${candidateLabel} from shortlist`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-red-500 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>}</div></article>
}

function FilterInput({ value, onChange, placeholder }) {
  return <label><span className="sr-only">Filter by {placeholder}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-32" /></label>
}
