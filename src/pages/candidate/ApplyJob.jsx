import React, { useRef, useState } from 'react'
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

export default function ApplyJob() {
  const { jobId } = useParams()
  const { jobs, candidate, resumes, applications, dispatch } = useCandidateDashboard()
  const job = jobs.find((item) => item.id === jobId)
  const [form, setForm] = useState({ resumeId: resumes.find((resume) => resume.active && resume.status === 'Approved')?.id || '', coverNote: '' })
  const [errors, setErrors] = useState({})
  const submitted = useRef(false)
  const navigate = useNavigate()
  const toast = useToast()
  if (!job) return <JobNotFound />
  const availableResumes = VALIDATION_CONFIG.enabled ? resumes.filter((resume) => resume.status === 'Approved') : resumes
  const submit = (event) => {
    event.preventDefault()
    if (submitted.current) return
    const nextErrors = validateApplication(form, resumes, applications, jobId)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    submitted.current = true
    dispatch({ type: 'apply', application: { id: crypto.randomUUID(), jobId, resumeId: form.resumeId, coverNote: form.coverNote.trim(), applied: new Date().toISOString(), status: 'Applied' }, activity: { id: crypto.randomUUID(), icon: 'send-horizontal', text: `Application submitted – ${job.title} at ${job.hospital}`, time: 'Just now' } })
    toast('Demo application submitted. You can track it in My Applications.')
    navigate('/candidate/applications')
  }
  return <><PageHeading title={`Apply for ${job.title}`} subtitle={`at ${job.hospital} · ${job.location}`} /><form noValidate onSubmit={submit} className="med-card space-y-5"><div><label htmlFor="application-resume" className="med-body mb-2 block font-semibold">Resume</label><Select id="application-resume" value={form.resumeId} aria-invalid={Boolean(errors.resumeId) || undefined} aria-describedby="application-resume-help application-resume-error" onChange={(event) => { setForm({ ...form, resumeId: event.target.value }); setErrors({ ...errors, resumeId: undefined }) }} className="w-full"><option value="">Select a resume</option>{availableResumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} · {resume.status}</option>)}</Select><p id="application-resume-help" className="med-caption mt-2 text-ink-400">Only approved resumes can be used for applications.</p>{errors.resumeId && <p id="application-resume-error" role="alert" className="med-caption mt-1 text-red-600">{errors.resumeId}</p>}{!availableResumes.length && <Link className="med-body mt-2 inline-block font-semibold text-brand-600" to="/candidate/resume-management">Manage your resumes</Link>}</div><ProfileField name="coverNote" label="Cover Note (Optional)" type="textarea" placeholder="Write a brief note to the hiring team about why you’re a great fit for this role…" value={form.coverNote} error={errors.coverNote} onChange={(value) => { setForm({ ...form, coverNote: value }); setErrors({ ...errors, coverNote: undefined }) }} /><p className="med-caption text-ink-600">Applying as {candidate.firstName} {candidate.lastName}{candidate.headline ? ` · ${candidate.headline}` : ''}</p><p className="med-caption rounded-lg border border-brand-100 bg-brand-50 p-3 text-brand-600">This is a demo application. No information is sent to the employer.</p>{errors.application && <p role="alert" className="med-body text-red-600">{errors.application} <Link to="/candidate/applications" className="underline">View My Applications</Link></p>}<div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(`/candidate/jobs/${job.id}`)}>Cancel</Button><Button type="submit">Submit Application</Button></div></form><div className="grid gap-4 lg:grid-cols-2"><ProfileSection title="Application Tips"><ul className="med-body space-y-3 text-ink-600">{['Tailor your cover note to the role and highlight relevant experience.', 'Double-check your resume formatting and ensure certifications are up to date.', 'Keep your cover note concise and focus on impact.'].map((tip) => <li key={tip} className="flex gap-2"><CandidateIcon name="circle-check" className="mt-0.5 h-4 w-4 text-brand-600" />{tip}</li>)}</ul></ProfileSection><ProfileSection title="What happens next?"><ol className="med-body list-decimal space-y-3 pl-5 text-ink-600"><li>Your demo application appears in My Applications.</li><li>Your application count and recent activity update.</li><li>Recruiter review and interview updates will be available when the service is connected.</li></ol></ProfileSection></div></>
}
