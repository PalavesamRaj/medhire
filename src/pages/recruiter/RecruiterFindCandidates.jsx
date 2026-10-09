import React, { useEffect, useState } from 'react'
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, Eye, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const initialFilters = { specialty: '', location: '', experience: '', licenseState: '', employment: '', availability: '' }
const filters = [
  ['specialty', 'Specialty'],
  ['location', 'Location'],
  ['experience', 'Experience', ['1-3 years', '4-7 years', '8+ years']],
  ['licenseState', 'License State'],
  ['employment', 'Employment Preference', ['Full-time', 'Part-time', 'Contract']],
  ['availability', 'Availability', ['Immediate', '2 Weeks Notice', '1 Month']],
]

export default function RecruiterFindCandidates() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('search') || '')
  const [selectedFilters, setSelectedFilters] = useState(initialFilters)
  const [results, setResults] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [shortlisted, setShortlisted] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    const experience = selectedFilters.experience
    const [minExperience, maxExperience] = experience === '8+ years' ? ['8', ''] : experience === '4-7 years' ? ['4', '7'] : experience === '1-3 years' ? ['1', '3'] : ['', '']
    recruiterApi.searchCandidates({ query: submittedQuery, specialty: selectedFilters.specialty, location: selectedFilters.location, minExperience, maxExperience, licenseState: selectedFilters.licenseState, employment: selectedFilters.employment, availability: selectedFilters.availability, page, pageSize: 20 }).then((payload) => {
      if (!active) return
      const response = getListResponse(payload); setResults(response.items); setPagination(response.pagination)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [submittedQuery, selectedFilters, page, reload])

  const updateFilter = (key, value) => { setSelectedFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const clearFilters = () => { setQuery(''); setSubmittedQuery(''); setSelectedFilters(initialFilters); setPage(1) }
  const saveCandidate = async (candidate) => {
    const publicId = candidate.publicId || candidate.id
    setSavingId(publicId); setActionMessage('')
    try {
      if (shortlisted.includes(publicId)) return
      await recruiterApi.addShortlistedCandidate(publicId)
      setShortlisted((current) => [...current, publicId]); setActionMessage('Candidate added to your shortlist.')
    } catch (requestError) { setActionMessage(requestError.message) } finally { setSavingId(null) }
  }
  const hasFilters = Boolean(submittedQuery || Object.values(selectedFilters).some(Boolean))

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold tracking-wide text-teal-600">CANDIDATE SEARCH</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Find Healthcare Professionals</h1><p className="mt-1 text-sm text-slate-500">Search verified healthcare talent by specialty, experience and location.</p></section>
    <form onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); setPage(1) }} className="flex flex-col gap-3.5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
      <label className="relative block flex-1"><span className="sr-only">Search by role, skill, or specialty</span><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by role, skill, specialty..." className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><Search className="h-3.5 w-3.5" />Search Candidates</button>
    </form>
    <div className="flex flex-wrap items-center gap-2"><div className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" />Filters</div>{filters.map(([key, label, options]) => options ? <label key={key} className={`relative inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${selectedFilters[key] ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}><span className="sr-only">{label}</span><select value={selectedFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="appearance-none bg-transparent pr-4 outline-none"><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 h-3 w-3" /></label> : <input key={key} aria-label={label} value={selectedFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} placeholder={label} className="h-9 w-32 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500" />)}{hasFilters && <button type="button" onClick={clearFilters} className="ml-auto text-xs font-semibold text-blue-600">Clear Filters</button>}</div>
    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold text-slate-900">Healthcare Professionals</h2><span className="text-xs text-slate-500">{pagination.total} candidates found</span></div>
    {error && <RecruiterApiError error={error} onRetry={() => setReload((n) => n + 1)} />}
    {actionMessage && <p role="status" className="text-sm text-slate-600">{actionMessage}</p>}
    {loading ? <RecruiterLoading label="Searching candidates…" /> : <div className="flex flex-col gap-3">
      {results.map((candidate) => <article key={candidate.publicId || candidate.id} className="flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 xl:flex-row xl:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-bold text-blue-600">{candidate.initials || '—'}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-slate-900">{candidate.title}</h3>{candidate.specialty && <span className="rounded-sm border border-teal-100 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">{candidate.specialty}</span>}<Badge tone="teal" className="normal-case tracking-normal">Verified Credentials</Badge>{candidate.unlocked && <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>{candidate.publicId || candidate.id}</span><span>{candidate.experience}</span><span>{candidate.location}</span>{candidate.education && <span>Education: {candidate.education}</span>}{candidate.license && <span>License: {candidate.license}</span>}{candidate.availability && <span>Available: {candidate.availability}</span>}</div><div className="mt-2 flex flex-wrap gap-1.5">{(candidate.tags || []).map((tag) => <span key={tag} className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tag}</span>)}</div></div>
        <div className="flex w-full shrink-0 items-center gap-2 xl:w-auto"><Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId || candidate.id)}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 xl:flex-none"><Eye className="h-3.5 w-3.5" />View Profile</Link><button type="button" disabled={savingId === (candidate.publicId || candidate.id) || shortlisted.includes(candidate.publicId || candidate.id)} onClick={() => saveCandidate(candidate)} aria-label={`Add ${candidate.title} to shortlist`} className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-blue-600 disabled:opacity-50"><Bookmark className="h-4 w-4" fill={shortlisted.includes(candidate.publicId || candidate.id) ? 'currentColor' : 'none'} /></button></div>
      </article>)}
      {!results.length && !error && <RecruiterEmpty>No candidates match the selected search and filters.</RecruiterEmpty>}
    </div>}
    <div className="flex items-center justify-between pt-2 text-xs text-slate-500"><span>Showing {results.length ? `${(page - 1) * pagination.pageSize + 1}-${(page - 1) * pagination.pageSize + results.length}` : '0'} of {pagination.total}</span><nav aria-label="Candidate results pages" className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="flex items-center gap-1 rounded border px-2 py-2 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />Prev</button><span>Page {pagination.page || page} of {pagination.totalPages || 1}</span><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)} className="flex items-center gap-1 rounded border px-2 py-2 disabled:opacity-40">Next<ChevronRight className="h-3.5 w-3.5" /></button></nav></div>
  </div>
}
