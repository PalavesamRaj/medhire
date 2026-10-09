import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Plus, RefreshCw, Users } from 'lucide-react'
import { Field, Input, Select } from '../../components/ui/FormControls'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const statusStyle = {
  PENDING_APPROVAL: ['bg-amber-50 text-amber-700', 'Pending admin approval'],
  ACTIVE: ['bg-emerald-50 text-emerald-700', 'Active'],
  REJECTED: ['bg-red-50 text-red-700', 'Rejected'],
  CLOSED: ['bg-slate-100 text-slate-600', 'Closed'],
  REMOVED: ['bg-red-50 text-red-700', 'Removed'],
}
const statusKey = (status) => String(status || 'PENDING_APPROVAL').toUpperCase().replace(/\s+/g, '_').replace('PUBLISHED', 'ACTIVE')

const emptyForm = { title: '', specialty: '', location: '', employmentType: 'Full-time', salaryRange: '', description: '', requirements: '' }

function jobsFrom(payload) {
  const data = payload?.data || payload
  if (Array.isArray(data)) return data
  return data?.jobs || data?.items || data?.results || []
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
      }
      else await recruiterApi.createJob(jobData)
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
    setEditingJobId(String(job.id || job.jobId || job._id))
    setEditingJob(job)
    setForm({ title: job.title || job.jobTitle || '', specialty: job.specialty || job.department || '', location: job.location || job.city || '', employmentType: job.employmentType || job.type || 'Full-time', salaryRange: job.salaryRange || job.salary || '', description: job.description || '', requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '' })
    setError(''); setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeJob = async (job) => {
    const id = String(job.id || job.jobId || job._id)
    setError(''); setSuccess('')
    try { await recruiterApi.closeJob(id); setSuccess('Job closed. Existing applications are kept.'); await loadJobs() }
    catch (requestError) { setError(requestError.message || 'Unable to close this job.') }
  }

  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job Postings</h1><p className="mt-1 text-sm text-slate-500">Create an opening and manage jobs posted by your organization.</p></div>
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} posted</span>
    </header>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Plus className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-slate-900">{editingJobId ? 'Edit job posting' : 'Post a new job'}</h2><p className="text-sm text-slate-500">Share the role details with healthcare professionals.</p></div></div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="Job title"><Input name="title" value={form.title} onChange={update} placeholder="e.g. Registered Nurse" required /></Field>
        <Field label="Specialty"><Input name="specialty" value={form.specialty} onChange={update} placeholder="e.g. Critical Care" required /></Field>
        <Field label="Location"><Input name="location" value={form.location} onChange={update} placeholder="City, State or Remote" required /></Field>
        <Field label="Employment type"><Select name="employmentType" value={form.employmentType} onChange={update}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Per Diem</option><option>Temporary</option></Select></Field>
        <Field label="Salary range (optional)"><Input name="salaryRange" value={form.salaryRange} onChange={update} placeholder="e.g. $80,000–$100,000 / year" /></Field>
        <div className="md:col-span-2"><Field label="Job description"><textarea name="description" value={form.description} onChange={update} rows={5} required placeholder="Describe the role and responsibilities" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" /></Field></div>
        <div className="md:col-span-2"><Field label="Requirements" hint="Enter one requirement per line."><textarea name="requirements" value={form.requirements} onChange={update} rows={4} placeholder={'Active state license\nTwo years of relevant experience'} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" /></Field></div>
        {error && <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}
        {success && <p role="status" className="text-sm text-emerald-700 md:col-span-2">{success}</p>}
        <div className="flex gap-3 md:col-span-2"><button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4" />{saving ? 'Saving…' : editingJobId ? 'Save Changes' : 'Submit for Approval'}</button>{editingJobId && <button type="button" onClick={() => { setEditingJobId(''); setEditingJob(null); setForm(emptyForm) }} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold">Cancel</button>}</div>
      </form>
    </section>

    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Your posted jobs</h2><p className="text-sm text-slate-500">Jobs associated with your recruiter account.</p></div><button type="button" onClick={loadJobs} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
      {loadError && <RecruiterApiError error={loadError} onRetry={loadJobs} />}
      {loading ? <RecruiterLoading label="Loading your job postings…" /> : !loadError && jobs.length === 0 ? <RecruiterEmpty><span className="inline-flex flex-col items-center gap-2"><BriefcaseBusiness className="h-6 w-6" />No jobs posted yet. Use the form above to submit your first opening.</span></RecruiterEmpty> : !loadError && <div className="grid gap-3">{jobs.map((job) => <article key={job.id || job.jobId || job._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{job.title || job.jobTitle}</h3><p className="mt-1 text-sm text-slate-600">{[job.specialty || job.department, job.location || job.city, job.employmentType || job.type].filter(Boolean).join(' · ')}</p>{(job.salaryRange || job.salary) && <p className="mt-1 text-sm text-slate-500">{job.salaryRange || job.salary}</p>}{job.expiresAt && <p className="mt-1 text-xs text-slate-500">Expires {new Date(job.expiresAt).toLocaleDateString()}</p>}</div>{(() => { const [tone, label] = statusStyle[statusKey(job.status)] || statusStyle.PENDING_APPROVAL; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span> })()}</div>{statusKey(job.status) === 'REJECTED' && job.rejectionReason && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {job.rejectionReason}</p>}<p className="mt-3 line-clamp-3 text-sm text-slate-600">{job.description}</p><div className="mt-3 flex flex-wrap gap-4">{statusKey(job.status) === 'ACTIVE' && <Link to={`/recruiter/jobs/${job.id || job.jobId || job._id}/applications`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><Users className="h-4 w-4" />View applicants{typeof job.applicationCount === 'number' ? ` (${job.applicationCount})` : ''}</Link>}{!['CLOSED', 'REMOVED'].includes(statusKey(job.status)) && <button type="button" onClick={() => editJob(job)} className="text-sm font-semibold text-slate-700">Edit</button>}{statusKey(job.status) === 'ACTIVE' && <button type="button" onClick={() => closeJob(job)} className="text-sm font-semibold text-red-600">Close job</button>}</div></article>)}</div>}
    </section>
  </div>
}
