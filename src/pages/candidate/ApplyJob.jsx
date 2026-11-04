import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import ProfileSection from '../../components/candidate/dashboard/ProfileSection'
import CandidateIcon from '../../components/candidate/dashboard/CandidateIcon'
import { JobNotFound } from './JobDetails'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/FormControls'
import ProfileField from '../../components/candidate/profile/ProfileField'
import { useToast } from '../../components/ui/ToastProvider'
import { validateApplication } from '../../lib/candidateDashboardValidation'
import { VALIDATION_CONFIG } from '../../lib/validationConfig'
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'
import { normalizeApplication, normalizeJob } from '../../lib/candidateDashboardState'

export default function ApplyJob() {
  const { jobId } = useParams()
  const { jobs, candidate, resumes, applications, dispatch } = useCandidateDashboard()
  const cachedJob = jobs.find((item) => item.id === jobId)
  const [job, setJob] = useState(cachedJob || null)
  const [jobLoading, setJobLoading] = useState(!cachedJob)
  const [form, setForm] = useState({ resumeId: resumes.find((resume) => resume.active)?.id || '', coverNote: '' })
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [busy, setBusy] = useState(false)
  const submitted = useRef(false)
  const navigate = useNavigate()
  const toast = useToast()
  useEffect(() => {
    if (!form.resumeId && resumes.length) {
      setForm((current) => current.resumeId ? current : { ...current, resumeId: (resumes.find((resume) => resume.active) || resumes[0]).id })
    }
  }, [resumes, form.resumeId])
  useEffect(() => {
    if (cachedJob) { setJob(cachedJob); setJobLoading(false); return undefined }
    let active = true
    candidateDashboardApi.getJobDetails(jobId).then((response) => {
      if (!active) return
      const data = response?.data || response || {}
      const detail = normalizeJob(data.job || data)
      setJob(detail.id ? detail : null)
    }).catch(() => { if (active) setJob(null) }).finally(() => { if (active) setJobLoading(false) })
    return () => { active = false }
  }, [cachedJob, jobId])
  if (jobLoading) return <PageHeading title="Loading opportunity…" subtitle="Fetching current job details" />
  if (!job) return <JobNotFound />
  const availableResumes = resumes
  const submit = async (event) => {
    event.preventDefault()
    if (submitted.current) return
    const nextErrors = validateApplication(form, resumes, applications, jobId)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    submitted.current = true
    setBusy(true)
    setRequestError('')
    try {
      const response = await candidateDashboardApi.applyForJob(jobId, { resumeId: form.resumeId, coverLetter: form.coverNote.trim() })
      const data = response?.data || response || {}
      const application = data.application || data
      application.id = application.id || application.applicationId
      application.applicationId = application.applicationId || application.id
      const normalizedApplication = normalizeApplication({ ...application, status: application.status || 'APPLIED' })
      normalizedApplication.appliedAt = normalizedApplication.appliedAt || new Date().toISOString()
      dispatch({ type: 'apply', application: { ...normalizedApplication, jobId: normalizedApplication.jobId || jobId }, activity: { id: normalizedApplication.id || crypto.randomUUID(), icon: 'send-horizontal', text: `Application submitted – ${job.title} at ${job.hospital}`, time: 'Just now' } })
      toast('Your application was submitted.')
      navigate('/candidate/applications')
    } catch (error) {
      submitted.current = false
      setRequestError(error.message || 'Unable to submit your application.')
    } finally { setBusy(false) }
  }
  return <><PageHeading title={`Apply for ${job.title}`} subtitle={`at ${job.hospital} · ${job.location}`} /><form noValidate onSubmit={submit} className="med-card space-y-5"><div><label htmlFor="application-resume" className="med-body mb-2 block font-semibold">Resume <span className="text-red-600">*</span></label>{availableResumes.length ? <Select id="application-resume" required value={form.resumeId} aria-invalid={Boolean(errors.resumeId) || undefined} aria-describedby="application-resume-help application-resume-error" onChange={(event) => { setForm({ ...form, resumeId: event.target.value }); setErrors({ ...errors, resumeId: undefined }) }} className="w-full"><option value="">Select a resume</option>{availableResumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} · {resume.status}</option>)}</Select> : <p className="med-body rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">Upload a resume before applying for this role.</p>}<p id="application-resume-help" className="med-caption mt-2 text-ink-400">Choose a resume to include with your application.</p>{errors.resumeId && <p id="application-resume-error" role="alert" className="med-caption mt-1 text-red-600">{errors.resumeId}</p>}{!availableResumes.length && <Link className="med-body mt-2 inline-block font-semibold text-brand-600" to="/candidate/resume-management">Upload a resume</Link>}</div><ProfileField name="coverNote" label="Cover Note (Optional)" type="textarea" placeholder="Write a brief note to the hiring team about why you’re a great fit for this role…" value={form.coverNote} error={errors.coverNote} onChange={(value) => { setForm({ ...form, coverNote: value }); setErrors({ ...errors, coverNote: undefined }) }} /><p className="med-caption text-ink-600">Applying as {candidate.firstName} {candidate.lastName}{candidate.headline ? ` · ${candidate.headline}` : ''}</p>{requestError && <p role="alert" className="med-body text-red-600">{requestError.message || requestError}</p>}{errors.application && <p role="alert" className="med-body text-red-600">{errors.application} <Link to="/candidate/applications" className="underline">View My Applications</Link></p>}<div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button type="submit" disabled={busy || !availableResumes.length}>{busy ? 'Submitting…' : 'Submit Application'}</Button></div></form></>
}
