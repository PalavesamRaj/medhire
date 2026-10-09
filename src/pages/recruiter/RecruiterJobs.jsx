import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, DollarSign,
  MapPin, Pencil, Plus, RefreshCw, Search, Users, X,
} from 'lucide-react'
import { Field, Input, Select } from '../../components/ui/FormControls'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const statusStyle = {
  PENDING_APPROVAL: ['border-amber-200 bg-amber-50 text-amber-800', 'Pending review'],
  ACTIVE: ['border-emerald-200 bg-emerald-50 text-emerald-800', 'Active'],
  REJECTED: ['border-red-200 bg-red-50 text-red-800', 'Rejected'],
  CLOSED: ['border-slate-200 bg-slate-100 text-slate-700', 'Closed'],
  REMOVED: ['border-red-200 bg-red-50 text-red-800', 'Removed'],
}
const statusKey = (status) => String(status || 'PENDING_APPROVAL').toUpperCase().replace(/\s+/g, '_').replace('PUBLISHED', 'ACTIVE')
const emptyForm = { title: '', specialty: '', location: '', employmentType: 'Full-time', salaryRange: '', description: '', requirements: '' }
const filters = [
  ['ALL', 'All jobs'],
  ['ACTIVE', 'Active'],
  ['PENDING_APPROVAL', 'In review'],
  ['REJECTED', 'Rejected'],
  ['CLOSED', 'Closed'],
]

function jobsFrom(payload) {
  const data = payload?.data || payload
  if (Array.isArray(data)) return data
  return data?.jobs || data?.items || data?.results || []
}

function jobId(job) {
  return String(job.id || job.jobId || job._id)
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function MetricCard({ label, value, icon: Icon, tone = 'blue', onClick }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </>
  )
  const className = `rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm shadow-slate-900/5 ${onClick ? 'transition hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''}`
  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <article className={className}>{content}</article>
}

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingJobId, setEditingJobId] = useState('')
  const [editingJob, setEditingJob] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const formRef = useRef(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setJobs(jobsFrom(await recruiterApi.getJobs()))
    } catch (requestError) {
      setLoadError(requestError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

  const counts = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((job) => statusKey(job.status) === 'ACTIVE').length,
    pending: jobs.filter((job) => statusKey(job.status) === 'PENDING_APPROVAL').length,
    applicants: jobs.reduce((total, job) => total + (Number(job.applicationCount) || 0), 0),
  }), [jobs])

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesStatus = activeFilter === 'ALL' || statusKey(job.status) === activeFilter
      const searchable = [job.title, job.jobTitle, job.specialty, job.department, job.location, job.city, job.description].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [jobs, activeFilter, query])

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const jobData = {
        title: form.title.trim(), specialty: form.specialty.trim(), location: form.location.trim(),
        employmentType: form.employmentType, salaryRange: form.salaryRange.trim(),
        description: form.description.trim(),
        requirements: form.requirements.split('\n').map((item) => item.trim()).filter(Boolean),
      }
      if (editingJobId) {
        const needsReview = statusKey(editingJob?.status) === 'ACTIVE' && ['title', 'specialty', 'location', 'salaryRange'].some((key) => String(jobData[key] || '') !== String(editingJob[key] || editingJob.salary || ''))
        await recruiterApi.updateJob(editingJobId, { ...jobData, ...(needsReview ? { status: 'PENDING_APPROVAL' } : {}) })
      } else {
        await recruiterApi.createJob(jobData)
      }
      setForm(emptyForm)
      setSuccess(editingJobId ? 'Job changes saved. Changes to an active job return it to admin review.' : 'Your job posting was submitted. It becomes visible to candidates once an administrator approves it.')
      setEditingJobId('')
      setEditingJob(null)
      await loadJobs()
    } catch (requestError) {
      setError(requestError.message || 'Unable to publish this job. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const editJob = (job) => {
    setEditingJobId(jobId(job))
    setEditingJob(job)
    setForm({ title: job.title || job.jobTitle || '', specialty: job.specialty || job.department || '', location: job.location || job.city || '', employmentType: job.employmentType || job.type || 'Full-time', salaryRange: job.salaryRange || job.salary || '', description: job.description || '', requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '' })
    setError('')
    setSuccess('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    document.getElementById('job-posting-title')?.focus({ preventScroll: true })
  }

  const cancelEdit = () => {
    setEditingJobId('')
    setEditingJob(null)
    setForm(emptyForm)
    setError('')
  }

  const closeJob = async (job) => {
    setError('')
    setSuccess('')
    try {
      await recruiterApi.closeJob(jobId(job))
      setSuccess('Job closed. Existing applications are kept.')
      await loadJobs()
    } catch (requestError) {
      setError(requestError.message || 'Unable to close this job.')
    }
  }

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    document.getElementById('job-posting-title')?.focus({ preventScroll: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Recruiter workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job postings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create openings, track review status, and manage applicants from one place.</p>
        </div>
        <button type="button" onClick={focusForm} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <Plus className="h-4 w-4" /> Create job posting
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Job posting overview">
        <MetricCard label="Total postings" value={counts.total} icon={BriefcaseBusiness} tone="blue" onClick={() => setActiveFilter('ALL')} />
        <MetricCard label="Active jobs" value={counts.active} icon={CheckCircle2} tone="green" onClick={() => setActiveFilter('ACTIVE')} />
        <MetricCard label="In review" value={counts.pending} icon={Clock3} tone="amber" onClick={() => setActiveFilter('PENDING_APPROVAL')} />
        <MetricCard label="Applicants" value={counts.applicants} icon={Users} tone="slate" />
      </section>

      <section ref={formRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Plus className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{editingJobId ? 'Edit job posting' : 'Create a new opening'}</h2>
              <p className="mt-0.5 text-sm text-slate-500">Add the details candidates need to understand the role.</p>
            </div>
          </div>
          {editingJobId && <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Editing posting</span>}
        </div>

        <form onSubmit={submit} className="grid gap-x-5 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Job title"><Input id="job-posting-title" name="title" value={form.title} onChange={update} placeholder="e.g. Registered Nurse" required /></Field>
          <Field label="Specialty"><Input name="specialty" value={form.specialty} onChange={update} placeholder="e.g. Critical Care" required /></Field>
          <Field label="Location"><Input name="location" value={form.location} onChange={update} placeholder="City, State or Remote" required /></Field>
          <Field label="Employment type"><Select name="employmentType" value={form.employmentType} onChange={update}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Per Diem</option><option>Temporary</option></Select></Field>
          <Field label="Salary range" hint="Optional. Include currency and pay period."><Input name="salaryRange" value={form.salaryRange} onChange={update} placeholder="e.g. ₹8–10 lakh / year" /></Field>
          <div className="hidden sm:block" aria-hidden="true" />
          <div className="sm:col-span-2"><Field label="Job description" hint="Describe the role, responsibilities, and what makes this opportunity a good fit."><textarea name="description" value={form.description} onChange={update} rows={5} required placeholder="Share the key responsibilities and details of the position." className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" /></Field></div>
          <div className="sm:col-span-2"><Field label="Requirements" hint="Add one requirement per line."><textarea name="requirements" value={form.requirements} onChange={update} rows={3} placeholder={'Active nursing license\nTwo years of relevant experience'} className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" /></Field></div>
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          {success && <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
            <p className="text-xs text-slate-500">New and significantly updated jobs are reviewed before candidates can find them.</p>
            <div className="flex gap-2">
              {editingJobId && <button type="button" onClick={cancelEdit} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><X className="h-4 w-4" />Cancel</button>}
              <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4" />{saving ? 'Saving…' : editingJobId ? 'Save changes' : 'Submit for review'}</button>
            </div>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your job postings</h2>
            <p className="mt-1 text-sm text-slate-500">Review each opening’s status and manage its applicants.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-64">
              <span className="sr-only">Search job postings</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your jobs" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <button type="button" onClick={loadJobs} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter jobs by status">
          {filters.map(([key, label]) => {
            const selected = activeFilter === key
            const count = key === 'ALL' ? counts.total : jobs.filter((job) => statusKey(job.status) === key).length
            return <button key={key} type="button" aria-pressed={selected} onClick={() => setActiveFilter(key)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
              {label}<span className={`rounded-full px-1.5 py-0.5 text-xs ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
            </button>
          })}
        </div>

        {loadError && <RecruiterApiError error={loadError} onRetry={loadJobs} />}
        {loading ? <RecruiterLoading label="Loading your job postings…" /> : !loadError && jobs.length === 0 ? (
          <RecruiterEmpty><span className="mx-auto flex max-w-sm flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-6 w-6" /></span><span className="font-semibold text-slate-800">No jobs posted yet</span><span>Create your first opening above to start reaching qualified healthcare professionals.</span><button type="button" onClick={focusForm} className="mt-1 font-semibold text-blue-600 hover:text-blue-700">Create a job posting</button></span></RecruiterEmpty>
        ) : !loadError && visibleJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-slate-800">No matching jobs</p><p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p><button type="button" onClick={() => { setQuery(''); setActiveFilter('ALL') }} className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">Clear filters</button></div>
        ) : !loadError && (
          <div className="grid gap-4">
            {visibleJobs.map((job) => {
              const status = statusKey(job.status)
              const [badgeClass, label] = statusStyle[status] || statusStyle.PENDING_APPROVAL
              const id = jobId(job)
              const title = job.title || job.jobTitle || 'Untitled job'
              const specialty = job.specialty || job.department
              const location = job.location || job.city
              const employment = job.employmentType || job.type
              const postedDate = formatDate(job.postedAt || job.createdAt)
              const requirements = Array.isArray(job.requirements) ? job.requirements : []
              return (
                <article key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-md">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><BriefcaseBusiness className="h-5 w-5" /></span>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
                          <p className="mt-1 text-sm text-slate-500">{[specialty, location].filter(Boolean).join(' · ') || 'Role details'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-3 text-sm text-slate-600">
                      {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" />{location}</span>}
                      {employment && <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4 text-slate-400" />{employment}</span>}
                      {(job.salaryRange || job.salary) && <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-slate-400" />{job.salaryRange || job.salary}</span>}
                      {postedDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-400" />Posted {postedDate}</span>}
                    </div>

                    {job.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>}
                    {requirements.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{requirements.slice(0, 3).map((requirement, index) => <span key={`${requirement}-${index}`} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{requirement}</span>)}{requirements.length > 3 && <span className="px-1 py-1 text-xs text-slate-500">+{requirements.length - 3} more</span>}</div>}
                    {status === 'REJECTED' && job.rejectionReason && <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Review feedback:</strong> {job.rejectionReason}</span></p>}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {typeof job.applicationCount === 'number' && <span className="inline-flex items-center gap-1.5 text-sm text-slate-500"><Users className="h-4 w-4" />{job.applicationCount} {job.applicationCount === 1 ? 'applicant' : 'applicants'}</span>}
                        {status === 'ACTIVE' && <Link to={`/recruiter/jobs/${encodeURIComponent(id)}/applications`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">View applicants <span aria-hidden="true">→</span></Link>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!['CLOSED', 'REMOVED'].includes(status) && <button type="button" onClick={() => editJob(job)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit</button>}
                        {status === 'ACTIVE' && <button type="button" onClick={() => closeJob(job)} className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">Close job</button>}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
