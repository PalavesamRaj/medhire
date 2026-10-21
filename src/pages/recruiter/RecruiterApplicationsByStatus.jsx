import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Users } from 'lucide-react'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import RecruiterRejectApplicationDialog from '../../components/recruiter/RecruiterRejectApplicationDialog'
import { recruiterApi } from '../../lib/recruiterApi'

const VIEWS = [
  { status: 'UNDER_REVIEW', title: 'Under Review', subtitle: 'Applications being reviewed by your recruiting team.' },
  { status: 'INTERVIEW', title: 'Interview', subtitle: 'Candidates who are currently in the interview stage.' },
  { status: 'HIRED', title: 'Hired', subtitle: 'Candidates hired for one of your job postings.' },
  { status: 'REJECTED', title: 'Rejected', subtitle: 'Applications rejected for one of your job postings.' },
]
const NEXT_STATUSES = {
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
}
const STATUS_LABELS = { SHORTLISTED: 'Shortlisted', HIRED: 'Hired', REJECTED: 'Rejected' }
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')
const statusKey = (value) => String(value || 'APPLIED').toUpperCase().replaceAll(' ', '_')

function applicantFrom(item) {
  const candidate = item.candidate ?? item.applicant ?? item.candidateProfile ?? item.candidate_profile ?? {}
  const unlocked = item.unlocked === true || item.isUnlocked === true || item.is_unlocked === true || candidate.unlocked === true || candidate.isUnlocked === true || candidate.is_unlocked === true
  const location = first(item.location, candidate.location, [candidate.city, candidate.state].filter(Boolean).join(', '))
  return {
    id: first(item.candidatePublicId, item.candidate_public_id, item.candidateId, item.candidate_id, candidate.publicId, candidate.public_id, candidate.candidateId, candidate.candidate_id, candidate.id),
    name: unlocked ? first(item.name, item.fullName, item.full_name, candidate.name, candidate.fullName, candidate.full_name, candidate.displayName, candidate.display_name) : first(item.maskedName, item.masked_name, candidate.maskedName, candidate.masked_name, candidate.maskedFullName, candidate.masked_full_name),
    initials: first(item.initials, candidate.initials, 'C'),
    title: first(item.title, item.jobTitle, item.job_title, candidate.title, candidate.jobTitle, candidate.job_title, candidate.currentJobTitle, candidate.current_job_title, candidate.profession),
    specialty: first(item.specialty, candidate.specialty, candidate.specialtyName, candidate.specialty_name),
    experience: first(item.experience, item.experienceYears, item.experience_years, candidate.experience, candidate.experienceYears, candidate.experience_years, candidate.yearsOfExperience),
    location: typeof location === 'object' ? [location.city, location.state, location.country].filter(Boolean).join(', ') : location,
  }
}

function unwrapCandidate(payload) {
  let result = payload
  for (let i = 0; i < 5 && result && !Array.isArray(result); i += 1) {
    if (result.data && typeof result.data === 'object') result = result.data
    else if (result.result && typeof result.result === 'object') result = result.result
    else break
  }
  return result?.candidate ?? result?.candidateProfile ?? result?.candidate_profile ?? result?.profile?.candidate ?? result?.profile ?? result ?? {}
}

export default function RecruiterApplicationsByStatus({ status }) {
  const view = VIEWS.find((item) => item.status === status) || VIEWS[0]
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState('')
  const [statusBusy, setStatusBusy] = useState('')
  const [query, setQuery] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const jobs = getListResponse(await recruiterApi.getJobs()).items
      const jobApplications = await Promise.all(jobs.map(async (job) => {
        const jobId = job.id || job.jobId || job.job_id
        if (!jobId) return []
        const applications = getListResponse(await recruiterApi.getJobApplications(jobId)).items
        return applications
          .filter((application) => statusKey(application.status || application.applicationStatus || application.application_status) === view.status)
          .map((application) => ({
            ...application,
            jobId,
            jobTitle: job.title || job.jobTitle || job.job_title || 'Job posting',
            jobLocation: job.location,
          }))
      }))
      const matching = jobApplications.flat()
      const enriched = await Promise.all(matching.map(async (application) => {
        const candidate = applicantFrom(application)
        if (!candidate.id || (candidate.title && candidate.specialty && candidate.location)) return { ...application, candidatePreview: candidate }
        try {
          const preview = applicantFrom({ candidate: unwrapCandidate(await recruiterApi.getCandidate(candidate.id)) })
          return { ...application, candidatePreview: Object.fromEntries(Object.entries({ ...candidate, ...preview, id: candidate.id }).filter(([, value]) => value !== undefined && value !== null && value !== '')) }
        } catch {
          return { ...application, candidatePreview: candidate }
        }
      }))
      setRows(enriched)
    } catch (error) {
      setLoadError(error)
    } finally {
      setLoading(false)
    }
  }, [view.status])

  useEffect(() => { load() }, [load])

  const changeStatus = async (application, nextStatus, reason = '') => {
    const applicationId = application.applicationId || application.application_id || application.id
    if (!applicationId || !NEXT_STATUSES[view.status]?.includes(nextStatus)) return false
    setStatusBusy(applicationId)
    setActionError('')
    try {
      await recruiterApi.updateApplicationStatus(applicationId, nextStatus, reason)
      setRows((current) => current.filter((item) => (item.applicationId || item.application_id || item.id) !== applicationId))
      return true
    } catch (error) {
      setActionError(error.message || 'Unable to update the application status.')
      return false
    } finally {
      setStatusBusy('')
    }
  }

  const confirmRejection = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    const saved = await changeStatus(rejectTarget, 'REJECTED', rejectReason.trim())
    if (saved) { setRejectTarget(null); setRejectReason('') }
  }

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((item) => {
      const candidate = item.candidatePreview || applicantFrom(item)
      return [candidate.name, candidate.id, candidate.title, candidate.specialty, candidate.location, item.jobTitle, item.jobLocation]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    })
  }, [rows, query])

  return <div className="flex flex-col gap-6">
    <header>
      <p className="text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{view.title} candidates</h1>
      <p className="mt-1 text-sm text-slate-500">{view.subtitle} Applications and job details are loaded from your recruiter account.</p>
    </header>
    <nav aria-label="Application status pages" className="flex flex-wrap gap-2">
      {VIEWS.map((item) => <Link key={item.status} to={`/recruiter/applications/${item.status.toLowerCase()}`} aria-current={item.status === view.status ? 'page' : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold ${item.status === view.status ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{item.title}</Link>)}
    </nav>
    <label className="block"><span className="sr-only">Search candidates and jobs</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate or job title…" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400" /></label>
    {!loading && !loadError && <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><Users className="h-5 w-5 text-blue-600" /><strong className="text-slate-900">{visibleRows.length}</strong> {view.title.toLowerCase()} {visibleRows.length === 1 ? 'application' : 'applications'}</div>}
    {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    {loadError && <RecruiterApiError error={loadError} onRetry={load} />}
    {loading ? <RecruiterLoading label={`Loading ${view.title.toLowerCase()} applications…`} /> : !loadError && visibleRows.length === 0 ? <RecruiterEmpty><span>{rows.length ? 'No applications match your search.' : `No ${view.title.toLowerCase()} applications found.`}</span></RecruiterEmpty> : !loadError && <div className="grid gap-3">
      {visibleRows.map((item) => {
        const candidate = item.candidatePreview || applicantFrom(item)
        const applicationId = item.applicationId || item.application_id || item.id
        const appliedAt = item.appliedAt || item.applied_at || item.createdAt || item.created_at
        return <article key={applicationId} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{candidate.initials}</span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">{candidate.name || (candidate.id ? `Candidate ${candidate.id.slice(0, 8)}` : 'Applicant')}</h2>
              <p className="mt-1 text-sm text-slate-600">{[candidate.title, candidate.specialty, candidate.experience ? `${candidate.experience} years experience` : ''].filter(Boolean).join(' · ') || 'Candidate profile summary is not available.'}</p>
              {candidate.location && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{candidate.location}</p>}
              <p className="mt-2 text-sm font-semibold text-slate-800">{item.jobTitle}</p>
              <p className="mt-1 text-xs text-slate-500">Applied {appliedAt ? new Date(appliedAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{view.title}</span>
            {candidate.id && <Link to={`/recruiter/candidates/${encodeURIComponent(candidate.id)}`} state={{ candidate: { ...candidate, publicId: candidate.id } }} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View profile</Link>}
            {NEXT_STATUSES[view.status]?.length > 0 && <select aria-label={`Move application to another status for ${candidate.name || candidate.id || 'candidate'}`} disabled={statusBusy === applicationId} defaultValue="" onChange={(event) => { const next = event.target.value; event.target.value = ''; if (next === 'REJECTED') { setActionError(''); setRejectTarget(item); setRejectReason('') } else if (next) changeStatus(item, next) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
              <option value="" disabled>{statusBusy === applicationId ? 'Saving…' : 'Move to next step'}</option>
              {NEXT_STATUSES[view.status].map((nextStatus) => <option key={nextStatus} value={nextStatus}>{STATUS_LABELS[nextStatus]}</option>)}
            </select>}
            <Link to={`/recruiter/jobs/${encodeURIComponent(item.jobId)}/applications`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600">Manage job applicants <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </article>
      })}
    </div>}
    <RecruiterRejectApplicationDialog open={Boolean(rejectTarget)} candidateName={rejectTarget ? (rejectTarget.candidatePreview || applicantFrom(rejectTarget)).name : ''} jobTitle={rejectTarget?.jobTitle || ''} reason={rejectReason} onReasonChange={setRejectReason} onCancel={() => { if (!statusBusy) { setRejectTarget(null); setRejectReason('') } }} onConfirm={confirmRejection} busy={Boolean(rejectTarget && statusBusy === (rejectTarget.applicationId || rejectTarget.application_id || rejectTarget.id))} error={actionError} />
  </div>
}
