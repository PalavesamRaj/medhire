import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Hired'].map((status) => [status, status])

export default function RecruiterJobApplicants() {
  const { jobId } = useParams()
  const [items, setItems] = useState([])
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [savingId, setSavingId] = useState('')
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

  const changeStatus = async (application, status) => {
    setSavingId(application.applicationId)
    setError('')
    try {
      await recruiterApi.updateApplicationStatus(application.applicationId, status)
      setItems((current) => current.map((item) => (item.applicationId === application.applicationId ? { ...item, status } : item)))
    } catch (requestError) {
      setError(requestError.message || 'Unable to update the application status.')
    } finally {
      setSavingId('')
    }
  }

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
      {items.map((item) => <article key={item.applicationId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900">{item.unlocked && item.name ? item.name : `Candidate ${item.initials || item.candidatePublicId || item.candidateId}`}</h3>
          <p className="mt-1 text-sm text-slate-600">{[item.title, item.specialty, item.experience, item.location].filter(Boolean).join(' · ')}</p>
          <p className="mt-1 text-xs text-slate-500">Applied {item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select aria-label="Application status" value={item.status} disabled={savingId === item.applicationId} onChange={(event) => changeStatus(item, event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20">
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Link to={`/recruiter/candidates/${encodeURIComponent(item.candidatePublicId || item.publicId || item.candidateId)}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View profile</Link>
          <button type="button" disabled={detailsLoading === item.applicationId} onClick={() => toggleDetails(item)} className="text-sm font-semibold text-slate-700 disabled:opacity-50">{detailsLoading === item.applicationId ? 'Loading…' : details[item.applicationId] ? 'Hide details' : 'Application details'}</button>
        </div>
        {details[item.applicationId] && <div className="w-full rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Cover letter</p><p className="mt-1 whitespace-pre-wrap">{details[item.applicationId].coverLetter || 'No cover letter provided.'}</p><p className="mt-3 text-xs text-slate-500">Candidate reference: {details[item.applicationId].candidatePublicId || item.candidatePublicId || '—'}</p></div>}
      </article>)}
    </div>}
  </div>
}
