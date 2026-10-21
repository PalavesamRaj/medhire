import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const STATUS_LABELS = { APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', REJECTED: 'Rejected', HIRED: 'Hired' }
const statusKey = (status) => String(status || 'APPLIED').toUpperCase().replaceAll(' ', '_')
const statusLabel = (status) => STATUS_LABELS[statusKey(status)] || status || 'Applied'

function getApplicant(item) {
  const candidate = item.candidate ?? item.applicant ?? {}
  const candidateId = item.candidatePublicId ?? item.candidate_public_id ?? item.publicId ?? item.public_id ?? candidate.publicId ?? candidate.public_id ?? item.candidateId ?? item.candidate_id ?? candidate.id ?? candidate.candidateId ?? candidate.candidate_id
  return {
    id: candidateId,
    initials: item.initials ?? candidate.initials ?? '',
    title: item.title ?? candidate.title ?? candidate.jobTitle ?? candidate.roleTitle ?? '',
    specialty: item.specialty ?? candidate.specialty ?? '',
    experience: item.experience ?? candidate.experience ?? candidate.experienceYears ?? '',
    location: item.location ?? candidate.location ?? '',
    name: item.unlocked ? item.name ?? candidate.name ?? candidate.fullName ?? '' : '',
  }
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

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const payload = await recruiterApi.getJobApplications(jobId)
      setItems(getListResponse(payload).items)
      setJob((payload?.data || payload)?.job || null)
    } catch (requestError) {
      setLoadError(requestError)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  const toggleDetails = async (application) => {
    const id = application.applicationId || application.id
    if (details[id]) { setDetails((current) => { const next = { ...current }; delete next[id]; return next }); return }
    setDetailsLoading(id); setError('')
    try {
      const payload = await recruiterApi.getApplication(id)
      setDetails((current) => ({ ...current, [id]: payload?.data?.application || payload?.application || payload?.data || payload }))
    } catch (requestError) { setError(requestError.message || 'Unable to load application details.') }
    finally { setDetailsLoading('') }
  }

  return <div className="flex flex-col gap-6">
    <header>
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to Job Postings</Link>
      <p className="mt-3 text-xs font-bold tracking-wide text-teal-600">RECRUITER PORTAL</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Applicants{job?.title ? ` — ${job.title}` : ''}</h1>
      <p className="mt-1 text-sm text-slate-500">Candidates who applied to this job. Contact details stay hidden until you unlock the candidate.</p>
    </header>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loadError && <RecruiterApiError error={loadError} onRetry={load} />}
    {loading ? <RecruiterLoading label="Loading applicants…" /> : !loadError && items.length === 0 ? <RecruiterEmpty><span className="inline-flex flex-col items-center gap-2"><Users className="h-6 w-6" />No one has applied to this job yet.</span></RecruiterEmpty> : !loadError && <div className="grid gap-3">
      {items.map((item) => { const applicant = getApplicant(item); const applicationId = item.applicationId || item.id; return <article key={applicationId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900">{applicant.name || (applicant.initials ? `Candidate ${applicant.initials}` : 'Applicant')}</h3>
          <p className="mt-1 text-sm text-slate-600">{[applicant.title, applicant.specialty, applicant.experience, applicant.location].filter(Boolean).join(' · ') || 'Candidate profile details are not included in this application response.'}</p>
          <p className="mt-1 text-xs text-slate-500">Applied {item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{statusLabel(item.status)}</span>
          {applicant.id && <Link to={`/recruiter/candidates/${encodeURIComponent(applicant.id)}`} state={{ candidate: { ...applicant, publicId: applicant.id } }} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View profile</Link>}
          <button type="button" disabled={detailsLoading === applicationId} onClick={() => toggleDetails({ ...item, applicationId })} className="text-sm font-semibold text-slate-700 disabled:opacity-50">{detailsLoading === applicationId ? 'Loading…' : details[applicationId] ? 'Hide details' : 'Application details'}</button>
        </div>
        {details[applicationId] && <div className="w-full rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Cover letter</p><p className="mt-1 whitespace-pre-wrap">{details[applicationId].coverLetter || 'No cover letter provided.'}</p></div>}
      </article>})}
    </div>}
  </div>
}
