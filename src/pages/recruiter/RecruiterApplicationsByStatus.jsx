import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, MapPin, Search } from 'lucide-react'
import Badge from '../../components/ui/Badge'
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
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)
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
    return rows.filter((item) => {
      const candidate = item.candidatePreview || applicantFrom(item)
      const searchable = [candidate.name, candidate.id, candidate.title, candidate.specialty, candidate.location, item.jobTitle, item.jobLocation]
        .filter(Boolean).join(' ').toLowerCase()
      return (!needle || searchable.includes(needle)) &&
        (!specialty || String(candidate.specialty || '').toLowerCase().includes(specialty.trim().toLowerCase())) &&
        (!location || String(candidate.location || item.jobLocation || '').toLowerCase().includes(location.trim().toLowerCase()))
    })
  }, [rows, query, specialty, location])
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize))
  const pageRows = visibleRows.slice((page - 1) * pageSize, page * pageSize)
  const clearFilters = () => { setQuery(''); setSpecialty(''); setLocation(''); setPage(1) }
  const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Hiring Workflow</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{view.title} Candidates</h1><p className="mt-1 text-sm text-slate-500">{view.subtitle}</p></section>
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative block min-w-0 flex-1"><span className="sr-only">Search {view.title.toLowerCase()} candidates</span><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={`Search ${view.title.toLowerCase()} candidates or jobs…`} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-500" /></label>
      <input value={specialty} onChange={(event) => { setSpecialty(event.target.value); setPage(1) }} aria-label="Filter by specialty" placeholder="Specialty" className="h-10 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-40" />
      <input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1) }} aria-label="Filter by location" placeholder="Location" className="h-10 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-40" />
    </div>
    {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    {loadError && <RecruiterApiError error={loadError} onRetry={load} />}
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      {loading ? <RecruiterLoading label={`Loading ${view.title.toLowerCase()} applications…`} /> : !loadError && pageRows.length === 0 ? <div className="p-5"><RecruiterEmpty>{rows.length ? 'No applications match your filters.' : `No ${view.title.toLowerCase()} applications found.`}</RecruiterEmpty></div> : !loadError && <table className="w-full min-w-[1200px] table-fixed border-collapse text-left">
        <colgroup><col style={{ width: '18%' }} /><col style={{ width: '17%' }} /><col style={{ width: '12%' }} /><col style={{ width: '6%' }} /><col style={{ width: '14%' }} /><col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col style={{ width: '13%' }} /></colgroup>
        <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700"><th scope="col" className="px-4 py-3">Candidate</th><th scope="col" className="px-4 py-3">Role</th><th scope="col" className="px-4 py-3">Specialty</th><th scope="col" className="px-4 py-3">Exp</th><th scope="col" className="px-4 py-3">Location</th><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Actions</th></tr></thead>
        <tbody>
        {pageRows.map((item, index) => {
          const candidate = item.candidatePreview || applicantFrom(item)
          const applicationId = item.applicationId || item.application_id || item.id
          const appliedAt = item.appliedAt || item.applied_at || item.createdAt || item.created_at
          const candidateLabel = candidate.name || (candidate.id ? `Candidate ${String(candidate.id).slice(0, 8)}` : 'Applicant')
          const nextStatuses = NEXT_STATUSES[view.status] || []
          const statusTone = view.status === 'HIRED' ? 'success' : view.status === 'REJECTED' ? 'error' : view.status === 'INTERVIEW' ? 'teal' : 'warning'
          return <tr key={applicationId || index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
            <td className="px-4 py-4"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{candidate.initials || 'C'}</span><span className="truncate text-sm font-semibold text-slate-900">{candidateLabel}</span></div></td>
            <td className="px-4 py-4"><div className="min-w-0 text-sm text-slate-600"><span className="block truncate">{candidate.title || '—'}</span><Link to={`/recruiter/jobs/${encodeURIComponent(item.jobId)}/applications`} className="mt-1 block truncate text-xs font-semibold text-blue-600 hover:text-blue-700">Applied to: {item.jobTitle || 'Job posting'}</Link></div></td>
            <td className="break-words px-4 py-4 text-sm text-slate-600">{candidate.specialty || '—'}</td><td className="px-4 py-4 text-sm text-slate-600">{candidate.experience ?? '—'}</td>
            <td className="px-4 py-4"><span className="flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />{candidate.location || item.jobLocation || '—'}</span></td>
            <td className="px-4 py-4 text-xs text-slate-500">{formatDate(appliedAt)}</td><td className="px-4 py-4"><Badge tone={statusTone} className="normal-case tracking-normal">{view.title}</Badge></td>
            <td className="px-4 py-4"><div className="flex flex-wrap items-center gap-2">{candidate.id ? <Link to={`/recruiter/candidates/${encodeURIComponent(candidate.id)}`} state={{ candidate: { ...candidate, publicId: candidate.id } }} aria-label={`View ${candidateLabel}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600"><Eye className="h-3.5 w-3.5" /></Link> : <span className="text-xs text-slate-400">No profile</span>}
              {nextStatuses.length > 0 && <select aria-label={`Move ${candidateLabel} to next step`} disabled={statusBusy === applicationId} defaultValue="" onChange={(event) => { const next = event.target.value; event.target.value = ''; if (next === 'REJECTED') { setActionError(''); setRejectTarget(item); setRejectReason('') } else if (next) changeStatus(item, next) }} className="h-8 max-w-36 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 disabled:opacity-50"><option value="" disabled>{statusBusy === applicationId ? 'Saving…' : 'Next step'}</option>{nextStatuses.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{STATUS_LABELS[nextStatus] || nextStatus}</option>)}</select>}
            </div></td>
          </tr>
        })}
        </tbody>
      </table>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Showing {pageRows.length ? `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + pageRows.length}` : '0'} of {visibleRows.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
    {(query || specialty || location) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-blue-600">Clear filters</button>}
    <RecruiterRejectApplicationDialog open={Boolean(rejectTarget)} candidateName={rejectTarget ? (rejectTarget.candidatePreview || applicantFrom(rejectTarget)).name : ''} jobTitle={rejectTarget?.jobTitle || ''} reason={rejectReason} onReasonChange={setRejectReason} onCancel={() => { if (!statusBusy) { setRejectTarget(null); setRejectReason('') } }} onConfirm={confirmRejection} busy={Boolean(rejectTarget && statusBusy === (rejectTarget.applicationId || rejectTarget.application_id || rejectTarget.id))} error={actionError} />
  </div>
}
