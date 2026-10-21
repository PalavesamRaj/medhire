import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import RecruiterRejectApplicationDialog from '../../components/recruiter/RecruiterRejectApplicationDialog'
import { recruiterApi } from '../../lib/recruiterApi'

const STATUS_LABELS = { APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', REJECTED: 'Rejected', HIRED: 'Hired' }
const STATUS_STYLES = {
  APPLIED: 'bg-slate-100 text-slate-700', UNDER_REVIEW: 'bg-amber-100 text-amber-800', SHORTLISTED: 'bg-blue-100 text-blue-800',
  INTERVIEW: 'bg-violet-100 text-violet-800', REJECTED: 'bg-red-100 text-red-800', HIRED: 'bg-emerald-100 text-emerald-800',
}
const NEXT_STATUSES = {
  APPLIED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['SHORTLISTED', 'INTERVIEW', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'HIRED', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED'],
  REJECTED: [], HIRED: [],
}
const statusKey = (status) => String(status || 'APPLIED').toUpperCase().replaceAll(' ', '_')
const statusLabel = (status) => STATUS_LABELS[statusKey(status)] || status || 'Applied'
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

function getApplicant(item) {
  const candidate = item.candidate ?? item.applicant ?? item.candidateProfile ?? item.candidate_profile ?? {}
  const candidateId = first(item.candidatePublicId, item.candidate_public_id, item.publicId, item.public_id, item.candidateId, item.candidate_id,
    candidate.publicId, candidate.public_id, candidate.candidateId, candidate.candidate_id, candidate.id)
  const isUnlocked = item.unlocked === true || item.isUnlocked === true || item.is_unlocked === true || candidate.unlocked === true || candidate.isUnlocked === true || candidate.is_unlocked === true
  const location = first(item.location, candidate.location, [candidate.city, candidate.state].filter(Boolean).join(', '))
  return {
    id: candidateId,
    unlocked: isUnlocked,
    initials: first(item.initials, candidate.initials),
    name: isUnlocked ? first(item.name, item.fullName, item.full_name, candidate.name, candidate.fullName, candidate.full_name, candidate.displayName, candidate.display_name) : first(item.maskedName, item.masked_name, candidate.maskedName, candidate.masked_name, candidate.maskedFullName, candidate.masked_full_name),
    title: first(item.title, item.jobTitle, item.job_title, candidate.title, candidate.jobTitle, candidate.job_title, candidate.currentJobTitle, candidate.current_job_title, candidate.profession),
    specialty: first(item.specialty, candidate.specialty, candidate.specialtyName, candidate.specialty_name),
    experience: first(item.experience, item.experienceYears, item.experience_years, candidate.experience, candidate.experienceYears, candidate.experience_years, candidate.yearsOfExperience),
    location: typeof location === 'object' ? [location.city, location.state, location.country].filter(Boolean).join(', ') : location,
  }
}

function profilePreview(payload) {
  let result = payload
  for (let depth = 0; depth < 5 && result && !Array.isArray(result); depth += 1) {
    if (result.data && typeof result.data === 'object') result = result.data
    else if (result.result && typeof result.result === 'object') result = result.result
    else break
  }
  return result?.candidate ?? result?.candidateProfile ?? result?.candidate_profile ?? result?.profile?.candidate ?? result?.profile ?? result ?? {}
}

function applicationStatus(item) {
  return item.status || item.applicationStatus || item.application_status || 'APPLIED'
}

export default function RecruiterJobApplicants() {
  const { jobId } = useParams()
  const [items, setItems] = useState([])
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState('')
  const [details, setDetails] = useState({})
  const [detailsLoading, setDetailsLoading] = useState('')
  const [statusBusy, setStatusBusy] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const payload = await recruiterApi.getJobApplications(jobId)
      const applications = getListResponse(payload).items
      setJob((payload?.data || payload)?.job || null)
      const enriched = await Promise.all(applications.map(async (application) => {
        const applicant = getApplicant(application)
        if (!applicant.id || (applicant.title && applicant.specialty && applicant.location)) return application
        try {
          const profile = profilePreview(await recruiterApi.getCandidate(applicant.id))
          return { ...application, candidate: { ...(application.candidate || application.applicant || {}), ...profile } }
        } catch {
          return application
        }
      }))
      setItems(enriched)
    } catch (requestError) {
      setLoadError(requestError)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  const toggleDetails = async (application) => {
    const id = application.applicationId || application.application_id || application.id
    if (details[id]) { setDetails((current) => { const next = { ...current }; delete next[id]; return next }); return }
    setDetailsLoading(id); setError('')
    try {
      const payload = await recruiterApi.getApplication(id)
      setDetails((current) => ({ ...current, [id]: payload?.data?.application || payload?.application || payload?.data || payload }))
    } catch (requestError) { setError(requestError.message || 'Unable to load application details.') }
    finally { setDetailsLoading('') }
  }

  const changeStatus = async (application, nextStatus, reason = '') => {
    const applicationId = application.applicationId || application.application_id || application.id
    const currentStatus = statusKey(applicationStatus(application))
    if (!applicationId || !NEXT_STATUSES[currentStatus]?.includes(nextStatus)) return false
    setStatusBusy(applicationId); setError('')
    try {
      const result = await recruiterApi.updateApplicationStatus(applicationId, nextStatus, reason)
      const updated = result?.data?.application || result?.data || result?.application || result
      setItems((current) => current.map((item) => (item.applicationId || item.application_id || item.id) === applicationId
        ? { ...item, ...updated, status: updated?.status || nextStatus }
        : item))
      return true
    } catch (requestError) {
      setError(requestError.message || 'Unable to update this application status.')
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

  return <div className="flex flex-col gap-6">
    <header>
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to Job Postings</Link>
      <p className="mt-3 text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Applicants{job?.title ? ` — ${job.title}` : ''}</h1>
      <p className="mt-1 text-sm text-slate-500">Review candidates who applied to this job and track each application’s status.</p>
    </header>
    {!loading && !loadError && <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><Users className="h-5 w-5 text-blue-600" /><strong className="text-slate-900">{items.length}</strong> {items.length === 1 ? 'applicant' : 'applicants'} for this job</div>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loadError && <RecruiterApiError error={loadError} onRetry={load} />}
    {loading ? <RecruiterLoading label="Loading applicants…" /> : !loadError && items.length === 0 ? <RecruiterEmpty><span className="inline-flex flex-col items-center gap-2"><Users className="h-6 w-6" />No one has applied to this job yet.</span></RecruiterEmpty> : !loadError && <div className="grid gap-3">
      {items.map((item) => {
        const applicant = getApplicant(item)
        const applicationId = item.applicationId || item.application_id || item.id
        const status = statusKey(applicationStatus(item))
        const nextStatuses = NEXT_STATUSES[status] || []
        const detail = details[applicationId]
        const appliedAt = item.appliedAt || item.applied_at || item.createdAt || item.created_at
        return <article key={applicationId} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{applicant.initials || 'C'}</div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">{applicant.name || (applicant.id ? `Candidate ${applicant.id.slice(0, 8)}` : 'Applicant')}</h2>
                <p className="mt-1 text-sm text-slate-600">{[applicant.title, applicant.specialty, applicant.experience ? `${applicant.experience} years experience` : ''].filter(Boolean).join(' · ') || 'Candidate profile summary is not available.'}</p>
                {applicant.location && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{applicant.location}</p>}
                <p className="mt-2 text-xs text-slate-500">Applied {appliedAt ? new Date(appliedAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <span className={`rounded-full px-3 py-2 text-sm font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.APPLIED}`}>{statusLabel(status)}</span>
              {applicant.id && <Link to={`/recruiter/candidates/${encodeURIComponent(applicant.id)}`} state={{ candidate: { ...applicant, publicId: applicant.id } }} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View profile</Link>}
              {nextStatuses.length > 0 && <select aria-label={`Update application status for ${applicant.name || applicant.id || 'applicant'}`} disabled={statusBusy === applicationId} defaultValue="" onChange={(event) => { const next = event.target.value; event.target.value = ''; if (next === 'REJECTED') { setRejectTarget(item); setRejectReason('') } else if (next) changeStatus(item, next) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
                <option value="" disabled>Update status</option>
                {nextStatuses.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{statusBusy === applicationId ? 'Saving…' : `Move to ${statusLabel(nextStatus)}`}</option>)}
              </select>}
              <button type="button" disabled={detailsLoading === applicationId} onClick={() => toggleDetails({ ...item, applicationId })} className="text-sm font-semibold text-slate-700 disabled:opacity-50">{detailsLoading === applicationId ? 'Loading…' : detail ? 'Hide details' : 'Application details'}</button>
            </div>
          </div>
          {detail && <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Cover letter</p><p className="mt-1 whitespace-pre-wrap">{detail.coverLetter || detail.cover_letter || 'No cover letter provided.'}</p></div>}
        </article>
      })}
    </div>}
    <RecruiterRejectApplicationDialog open={Boolean(rejectTarget)} candidateName={rejectTarget ? getApplicant(rejectTarget).name : ''} jobTitle={job?.title || ''} reason={rejectReason} onReasonChange={setRejectReason} onCancel={() => { if (!statusBusy) { setRejectTarget(null); setRejectReason('') } }} onConfirm={confirmRejection} busy={Boolean(rejectTarget && statusBusy === (rejectTarget.applicationId || rejectTarget.application_id || rejectTarget.id))} error={error} />
  </div>
}
