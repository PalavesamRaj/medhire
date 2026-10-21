import React, { useEffect, useState } from 'react'
import { Eye, LockKeyhole, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

export default function RecruiterShortlistedCandidates() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [unlockStatus, setUnlockStatus] = useState('')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    recruiterApi.getShortlistedCandidates({ query, specialty, unlockStatus, location, page, pageSize: 20 }).then((payload) => {
      if (!active) return
      const response = getListResponse(payload); setItems(response.items); setPagination(response.pagination)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, specialty, unlockStatus, location, page, reload])

  const remove = async (candidate) => {
    setRemovingId(candidate.id); setError(null)
    try { await recruiterApi.removeShortlistedCandidate(candidate.publicId || candidate.id); setItems((current) => current.filter((item) => item.id !== candidate.id)); setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) })) }
    catch (requestError) { setError(requestError) }
    finally { setRemovingId(null) }
  }
  const clearFilters = () => { setQuery(''); setSpecialty(''); setUnlockStatus(''); setLocation(''); setPage(1) }
  const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Shortlisted Candidates</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Shortlisted Candidates</h1><p className="mt-1 text-sm text-slate-500">Candidates saved for later consideration by your team.</p></section>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block min-w-0 flex-1"><span className="sr-only">Search shortlisted candidates</span><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search shortlisted candidates..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
      <FilterInput value={specialty} onChange={(value) => { setSpecialty(value); setPage(1) }} placeholder="Specialty" />
      <FilterSelect value={unlockStatus} onChange={(value) => { setUnlockStatus(value); setPage(1) }} placeholder="Unlock Status" options={['Unlocked', 'Locked']} />
      <FilterInput value={location} onChange={(value) => { setLocation(value); setPage(1) }} placeholder="Location" />
    </div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-700 xl:grid xl:grid-cols-[minmax(180px,1fr)_144px_96px_40px_96px_80px_96px_80px]"><span>Candidate</span><span>Role</span><span>Specialty</span><span>Exp</span><span>Location</span><span>Status</span><span>Date</span><span>Actions</span></div>
      {loading ? <RecruiterLoading label="Loading shortlist…" /> : items.map((candidate) => { const locked = candidate.status === 'Locked'; return <article key={candidate.id} className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 xl:grid-cols-[minmax(180px,1fr)_144px_96px_40px_96px_80px_96px_80px] xl:items-center"><div className="flex items-center gap-2.5"><div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${locked ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>{candidate.initials || '—'}</div><div className="text-sm font-semibold text-slate-900">{candidate.name || `Candidate ${candidate.publicId || candidate.id}`}<span className="mt-0.5 block text-xs font-normal text-slate-400">{candidate.publicId || candidate.id}</span></div></div><div className="text-sm text-slate-600">{candidate.title}</div><div className="text-sm text-slate-600">{candidate.specialty}</div><div className="text-sm text-slate-600">{candidate.experience}</div><div className="text-sm text-slate-600">{candidate.location}</div><div>{locked ? <Badge tone="slate" className="normal-case tracking-normal"><LockKeyhole className="mr-1 h-3 w-3" />Locked</Badge> : <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}</div><div className="text-sm text-slate-500">{formatDate(candidate.date)}</div><div className="flex items-center gap-2"><Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId || candidate.id)}`} aria-label={`View ${candidate.name || candidate.id}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600"><Eye className="h-3.5 w-3.5" /></Link><button type="button" disabled={removingId === candidate.id} onClick={() => remove(candidate)} aria-label={`Remove ${candidate.name || candidate.id} from shortlist`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-red-500 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button></div></article> })}
      {!loading && !error && !items.length && <RecruiterEmpty>No shortlisted candidates match your filters.</RecruiterEmpty>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>{pagination.total} shortlisted candidates</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {pagination.page || page} of {pagination.totalPages || 1}</span><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
    {(query || specialty || unlockStatus || location) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-blue-600">Clear Filters</button>}
  </div>
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return <label className="relative shrink-0"><span className="sr-only">Filter by {placeholder}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-auto"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function FilterInput({ value, onChange, placeholder }) {
  return <label><span className="sr-only">Filter by {placeholder}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-32" /></label>
}
