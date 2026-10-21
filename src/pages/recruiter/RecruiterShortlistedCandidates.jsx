import React, { useEffect, useMemo, useState } from 'react'
import { Eye, LockKeyhole, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

function normalizeShortlistedCandidate(item = {}) {
  const candidate = item.candidate || item.profile || item.candidateProfile || item.candidate_profile || item.candidateDetails || item.candidate_details || item
  const candidateId = item.candidateId || item.candidate_id || candidate.candidateId || candidate.candidate_id || candidate.id
  const publicId = item.publicId || item.public_id || item.candidatePublicId || item.candidate_public_id || candidate.publicId || candidate.public_id
  const id = candidateId || publicId || item.id
  const name = candidate.name || candidate.fullName || candidate.full_name || candidate.displayName || candidate.display_name || item.candidateName || item.candidate_name || item.fullName || item.full_name || item.name
  const city = candidate.city || candidate.cityName || candidate.city_name || item.city || item.city_name
  const state = candidate.state || candidate.stateName || candidate.state_name || item.state || item.state_name
  const location = candidate.location || candidate.locationName || candidate.location_name || item.location || item.location_name || [city, state].filter(Boolean).join(', ')
  const experienceValue = candidate.experience ?? item.experience ?? candidate.yearsOfExperience ?? candidate.years_of_experience ?? item.yearsOfExperience ?? item.years_of_experience
  const experience = typeof experienceValue === 'number' ? `${experienceValue} years` : experienceValue
  const rawStatus = item.unlockStatus || item.unlock_status || item.status || candidate.unlockStatus || candidate.unlock_status || candidate.status
  const unlockedValue = item.unlocked ?? item.isUnlocked ?? item.is_unlocked ?? candidate.unlocked ?? candidate.isUnlocked ?? candidate.is_unlocked
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
    date: item.shortlistedAt || item.shortlisted_at || item.savedAt || item.saved_at || item.createdAt || item.created_at || candidate.shortlistedAt || candidate.shortlisted_at || item.date,
  }
}

export default function RecruiterShortlistedCandidates() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [unlockStatus, setUnlockStatus] = useState('')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    // The API reference documents this GET without query parameters. Filter and paginate locally.
    recruiterApi.getShortlistedCandidates().then((payload) => {
      if (!active) return
      setItems(getListResponse(payload).items.map(normalizeShortlistedCandidate))
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  const filteredItems = useMemo(() => items.filter((candidate) => {
    const text = [candidate.name, candidate.title, candidate.specialty, candidate.location, candidate.status].filter(Boolean).join(' ').toLowerCase()
    return (!query || text.includes(query.trim().toLowerCase())) &&
      (!specialty || String(candidate.specialty || '').toLowerCase().includes(specialty.trim().toLowerCase())) &&
      (!location || String(candidate.location || '').toLowerCase().includes(location.trim().toLowerCase())) &&
      (!unlockStatus || candidate.status.toLowerCase() === unlockStatus.toLowerCase())
  }), [items, query, specialty, location, unlockStatus])
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
  const clearFilters = () => { setQuery(''); setSpecialty(''); setUnlockStatus(''); setLocation(''); setPage(1) }
  const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Shortlisted Candidates</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Shortlisted Candidates</h1><p className="mt-1 text-sm text-slate-500">Candidates saved for later consideration by your team.</p></section>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block min-w-0 flex-1"><span className="sr-only">Search shortlisted candidates</span><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search shortlisted candidates..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
      <FilterInput value={specialty} onChange={(value) => { setSpecialty(value); setPage(1) }} placeholder="Specialty" />
      <FilterSelect value={unlockStatus} onChange={(value) => { setUnlockStatus(value); setPage(1) }} placeholder="Unlock Status" options={['Unlocked', 'Locked']} />
      <FilterInput value={location} onChange={(value) => { setLocation(value); setPage(1) }} placeholder="Location" />
    </div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-700 xl:grid xl:grid-cols-[minmax(180px,1fr)_160px_112px_55px_120px_110px_90px_80px]"><span>Candidate</span><span>Role</span><span>Specialty</span><span>Exp</span><span>Location</span><span>Date</span><span>Status</span><span>Actions</span></div>
      {loading ? <RecruiterLoading label="Loading shortlisted candidates…" /> : pageItems.map((candidate, index) => <ShortlistedCandidateRow key={candidate.id || index} candidate={candidate} removing={removingId === candidate.id} onRemove={() => remove(candidate)} formatDate={formatDate} />)}
      {!loading && !error && !pageItems.length && <RecruiterEmpty>No shortlisted candidates match your filters.</RecruiterEmpty>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Showing {pageItems.length ? `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + pageItems.length}` : '0'} of {filteredItems.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
    {(query || specialty || unlockStatus || location) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-blue-600">Clear Filters</button>}
  </div>
}

function ShortlistedCandidateRow({ candidate, removing, onRemove, formatDate }) {
  const locked = candidate.status === 'Locked'
  const candidateLabel = candidate.name || 'Candidate profile'
  const profileId = candidate.publicId || candidate.candidateId || candidate.id
  return <article className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 xl:grid-cols-[minmax(180px,1fr)_160px_112px_55px_120px_110px_90px_80px] xl:items-center"><div className="flex items-center gap-2.5"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${locked ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>{candidate.initials || '—'}</div><div className="text-sm font-semibold text-slate-900">{candidateLabel}</div></div><div className="text-sm text-slate-600">{candidate.title || '—'}</div><div className="text-sm text-slate-600">{candidate.specialty || '—'}</div><div className="text-sm text-slate-600">{candidate.experience ?? '—'}</div><div className="text-sm text-slate-600">{candidate.location || '—'}</div><div className="text-xs text-slate-500">{formatDate(candidate.date)}</div><div>{locked ? <Badge tone="slate" className="normal-case tracking-normal"><LockKeyhole className="mr-1 h-3 w-3" />Locked</Badge> : <Badge tone="success" className="normal-case tracking-normal">{candidate.status === 'Unlocked' ? 'Unlocked' : 'Status unavailable'}</Badge>}</div><div className="flex items-center gap-2">{profileId ? <Link to={`/recruiter/candidates/${encodeURIComponent(profileId)}`} aria-label={`View ${candidateLabel}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600"><Eye className="h-3.5 w-3.5" /></Link> : <button type="button" disabled aria-label="Candidate ID unavailable" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600 disabled:opacity-40"><Eye className="h-3.5 w-3.5" /></button>}<button type="button" disabled={!candidate.candidateId || removing} onClick={onRemove} aria-label={`Remove ${candidateLabel} from shortlist`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-red-500 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button></div></article>
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return <label className="relative shrink-0"><span className="sr-only">Filter by {placeholder}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-auto"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function FilterInput({ value, onChange, placeholder }) {
  return <label><span className="sr-only">Filter by {placeholder}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-32" /></label>
}
