import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BriefcaseMedical, MapPin, Search, ShieldCheck } from 'lucide-react'
import { searchPublicJobs } from '../lib/publicApi'
import Button from '../components/ui/Button'

const PAGE_SIZE = 50

function getJobRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.jobs)) return payload.jobs
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function formatSalary(job) {
  if (job.salaryRange || job.salary_range) return job.salaryRange || job.salary_range
  const min = job.salaryMin ?? job.salary_min
  const max = job.salaryMax ?? job.salary_max
  if (min == null && max == null) return 'Salary not disclosed'
  const currency = job.currency || 'USD'
  const amount = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  if (min == null) return `Up to ${amount(max)}`
  if (max == null) return `From ${amount(min)}`
  return `${amount(min)} – ${amount(max)}`
}

function normalizePublicJob(job) {
  const organization = job.organization || job.hospital || {}
  const location = job.location || [job.city, job.state].filter(Boolean).join(', ')
  return {
    id: job.id || job.jobId || job.job_id,
    title: job.title || job.jobTitle || job.job_title || 'Healthcare opportunity',
    hospital: job.organizationName || job.organization_name || organization.name || job.hospitalName || job.hospital_name || 'Healthcare organization',
    location: typeof location === 'string' ? location : [location?.city, location?.state].filter(Boolean).join(', '),
    type: job.employmentType || job.employment_type || job.type || 'Employment type not specified',
    specialty: job.specialty || job.specialtyName || job.specialty_name || 'Healthcare',
    salary: formatSalary(job),
    shift: job.shift || job.shiftType || job.shift_type || '',
  }
}

export default function FindJobs() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [location, setLocation] = useState(params.get('location') || '')
  const [specialty, setSpecialty] = useState(params.get('specialty') || '')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [known, setKnown] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const specialties = [...new Set([...known, ...(specialty ? [specialty] : [])])].sort()
  const results = jobs

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const page = Math.max(1, Number(params.get('page')) || 1)
    searchPublicJobs({ q: params.get('q') || '', location: params.get('location') || '', specialty: params.get('specialty') || '', page, pageSize: PAGE_SIZE }, controller.signal)
      .then((payload) => {
        const data = payload?.data && !Array.isArray(payload.data) ? payload.data : payload
        const items = getJobRows(payload).map(normalizePublicJob).filter((job) => job.id)
        const meta = data?.pagination || payload?.pagination || {}
        setJobs(items); setError('')
        setPagination({ page: Number(meta.page) || page, pageSize: Number(meta.pageSize || meta.page_size) || PAGE_SIZE, total: Number(meta.total) || items.length, totalPages: Number(meta.totalPages || meta.total_pages) || 1 })
        setKnown((previous) => [...new Set([...previous, ...items.map((job) => job.specialty).filter(Boolean)])])
      })
      .catch((requestError) => { if (requestError.name !== 'AbortError') { setJobs([]); setPagination({ page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 }); setError('We could not load jobs right now. Please try again shortly.') } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [params])

  function search(event) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (location.trim()) next.set('location', location.trim())
    if (specialty) next.set('specialty', specialty)
    setParams(next)
  }

  function clearFilters() {
    setQuery('')
    setLocation('')
    setSpecialty('')
    setParams({})
  }

  return (
    <>
      <section className="bg-gradient-to-br from-teal-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="container-page text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1 text-xs font-semibold text-teal-700"><ShieldCheck className="h-4 w-4" /> Healthcare careers, all in one place</span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">Find work that makes a difference</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-600">Explore clinical opportunities from hospitals and care teams. Search by role, specialty, or location to find your next step.</p>
          <form onSubmit={search} className="mx-auto mt-8 grid max-w-5xl gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-lg shadow-ink-900/5 md:grid-cols-[1.3fr_1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl px-3"><Search className="h-5 w-5 shrink-0 text-teal-600" /><input aria-label="Job title or keyword" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Job title, hospital, or keyword" className="h-11 w-full min-w-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400" /></label>
            <label className="flex items-center gap-3 rounded-xl border-ink-100 px-3 md:border-l"><MapPin className="h-5 w-5 shrink-0 text-teal-600" /><input aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or state" className="h-11 w-full min-w-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400" /></label>
            <label className="flex items-center gap-3 rounded-xl border-ink-100 px-3 md:border-l"><BriefcaseMedical className="h-5 w-5 shrink-0 text-teal-600" /><select aria-label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-11 w-full min-w-0 bg-transparent text-sm text-ink-700 outline-none"><option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
            <Button type="submit" className="h-11 justify-center px-6">Search jobs</Button>
          </form>
          <p className="mt-4 text-xs text-ink-500">Browse opportunities and create a free profile to apply.</p>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Open opportunities</p><h2 className="mt-2 text-2xl font-bold text-ink-900">Healthcare jobs</h2></div>
          <p role="status" className="text-sm text-ink-500">{loading ? 'Loading jobs…' : `${pagination.total} ${pagination.total === 1 ? 'job' : 'jobs'} found`}</p>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {results.map((job) => <article key={job.id} className="flex flex-col rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
            <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><BriefcaseMedical className="h-6 w-6" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-ink-900">{job.title}</h3><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{job.type}</span></div><p className="mt-1 text-sm font-medium text-ink-600">{job.hospital}</p><p className="mt-1 flex items-center gap-1 text-sm text-ink-500"><MapPin className="h-4 w-4" />{job.location}</p></div></div>
            <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-md bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-600">{job.specialty}</span><span className="rounded-md bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-600">{job.shift} shift</span></div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4"><span className="text-sm font-bold text-ink-900">{job.salary}</span><Link to="/register/candidate"><Button size="sm" variant="secondary" icon={ArrowRight}>Create profile to apply</Button></Link></div>
          </article>)}
        </div>
        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && !results.length && <div className="mt-6 rounded-xl border border-dashed border-ink-300 bg-ink-50/50 px-6 py-12 text-center"><Search className="mx-auto h-8 w-8 text-ink-400" /><h3 className="mt-3 font-semibold text-ink-900">No jobs match those filters</h3><p className="mt-1 text-sm text-ink-600">Try a different keyword, location, or specialty.</p><button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700">Clear filters</button></div>}
        {!loading && !error && pagination.totalPages > 1 && <nav aria-label="Job results pages" className="mt-8 flex items-center justify-center gap-4"><button type="button" disabled={pagination.page <= 1} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(pagination.page - 1)); return next })} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm text-ink-600">Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(pagination.page + 1)); return next })} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>}
      </section>
      <section className="bg-ink-50 py-14"><div className="container-page flex flex-col items-start justify-between gap-5 rounded-2xl border border-ink-200 bg-white p-7 sm:flex-row sm:items-center sm:p-10"><div><h2 className="text-2xl font-bold text-ink-900">Let the right opportunity find you</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Build a healthcare profile, keep your credentials together, and connect with verified employers.</p></div><Link to="/register/candidate"><Button icon={ArrowRight}>Create your free profile</Button></Link></div></section>
    </>
  )
}
