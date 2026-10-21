import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import JobCard from '../../components/candidate/dashboard/JobCard'
import CandidateIcon from '../../components/candidate/dashboard/CandidateIcon'
import { Input, Select } from '../../components/ui/FormControls'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/DataDisplay'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import JobSearchInput from '../../components/candidate/dashboard/JobSearchInput'
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'

export default function JobSearch() {
  const { jobs } = useCandidateDashboard()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState(() => ({ q: params.get('q') || '', hospital: params.get('hospital') || '', location: params.get('location') || '' }))
  const [results, setResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const type = params.get('type') || 'All'
  const specialty = params.get('specialty') || ''
  useEffect(() => { setForm({ q: params.get('q') || '', hospital: params.get('hospital') || '', location: params.get('location') || '' }) }, [params])
  const setFilter = (name, value) => { const next = new URLSearchParams(params); if (value) next.set(name, value); else next.delete(name); setParams(next) }
  const search = (event) => { event.preventDefault(); const next = new URLSearchParams(params); Object.entries(form).forEach(([key, value]) => { if (value.trim()) next.set(key, value.trim()); else next.delete(key) }); setParams(next) }
  useEffect(() => {
    let active = true
    setSearching(true)
    setSearchError('')
    const timer = setTimeout(() => {
      candidateDashboardApi.searchJobs(Object.fromEntries(params)).then((response) => {
        if (!active) return
        const data = response?.data || response || {}
        setResults(Array.isArray(data) ? data : data.jobs || data.results || data.items || [])
      }).catch((error) => {
        if (!active) return
        setResults([])
        setSearchError(error.message || 'The job service is unavailable.')
      }).finally(() => { if (active) setSearching(false) })
    }, 200)
    return () => { active = false; clearTimeout(timer) }
  }, [params])
  return <><PageHeading title="Job Search" subtitle="Find your next healthcare opportunity" /><form onSubmit={search} className="med-card grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">{[['q', 'Job title or specialty', 'e.g. Registered Nurse'], ['hospital', 'Hospital or company', 'e.g. City Hospital'], ['location', 'Location', 'e.g. New York']].map(([name, label, placeholder]) => <JobSearchInput key={name} field={name} label={label} placeholder={placeholder} value={form[name]} onChange={(value) => setForm((current) => ({ ...current, [name]: value }))} className="!rounded-full" />)}<Button type="submit">Search</Button></form>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2" role="group" aria-label="Employment type">{['All', ...new Set(jobs.map((job) => job.type))].map((value) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setFilter('type', value === 'All' ? '' : value)} className={`med-caption rounded-full border px-3 py-1.5 ${type === value ? 'border-brand-600 bg-brand-600 font-semibold text-white' : 'border-ink-200 bg-brand-50 text-brand-600'}`}>{value}</button>)}</div><Select aria-label="Specialty" value={specialty} onChange={(event) => setFilter('specialty', event.target.value)} className="max-w-full"><option value="">All specialties</option>{[...new Set(jobs.map((job) => job.specialty))].map((value) => <option key={value}>{value}</option>)}</Select></div>
    {searchError && <p role="alert" className="med-caption text-amber-700">{searchError}</p>}<p role="status" className="med-caption text-ink-600">{searching ? 'Searching live opportunities…' : `${results.length} ${results.length === 1 ? 'opportunity' : 'opportunities'} found`}</p><div className="space-y-4">{results.length ? results.map((job) => <JobCard key={job.id || job.jobId} job={job} />) : !searching && <><EmptyState title={searchError ? 'Live jobs unavailable' : 'No matching jobs'} message={searchError ? 'Please try again when the job service is available.' : 'Try a different title, location, or specialty.'} /><Button variant="secondary" onClick={() => setParams({})}>Clear filters</Button></>}</div>
  </>
}
