import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, X, CheckCircle2, Info } from 'lucide-react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { useToast } from '../../../components/ui/ToastProvider'
import { validateResume } from '../../../lib/candidateProfileValidation'
import { profilePath, profileSteps, PROFILE_SETUP_STEPS } from '../../../lib/candidateProfileOptions'
import { candidateProfileApi } from '../../../lib/candidateProfileApi'

export default function ResumeUpload() {
  const { profile, updateSection } = useCandidateProfile()
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const pending = useRef(false)
  const input = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()
  const select = (files) => {
    if (pending.current || !files?.length) return
    if (files.length !== 1) { setFileError('Please select one resume file.'); return }
    const validation = validateResume(files[0])
    setFileError(validation.resume || '')
    if (!validation.resume) { updateSection('resume', files[0]); setError('') }
  }
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current) return
    setError('')
    const resume = profile.resume
    if (resume) {
      const resumeErrors = validateResume(resume)
      setFileError(resumeErrors.resume || '')
      if (resumeErrors.resume) return
      pending.current = true
      setBusy(true)
      try {
        await candidateProfileApi.uploadResume(resume)
        toast('Your resume was uploaded successfully.')
        navigate(profilePath(2), { replace: true })
      } catch (requestError) { setError(requestError.message) }
      finally { pending.current = false; setBusy(false) }
      return
    }
    navigate(profilePath(2), { replace: true })
  }
  return <CandidateProfileLayout step={1} onSubmit={submit} busy={busy} error={error}>
    <div onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files) }} className={`rounded-lg border-2 border-dashed ${dragging ? 'border-brand-600 bg-brand-100' : 'border-brand-500/50 bg-ink-50'} ${busy ? 'opacity-60' : ''}`}>
      <button type="button" disabled={busy} onClick={() => input.current?.click()} aria-describedby="resume-hint resume-error" className="flex w-full flex-col items-center justify-center gap-3 px-5 py-12 text-center focus-visible:outline-brand-600"><span className="rounded-full bg-brand-50 p-3 text-brand-600"><UploadCloud size={25} /></span><span className="text-sm font-semibold text-ink-900">Drag &amp; drop your resume here or click to browse</span><span id="resume-hint" className="text-xs text-ink-400">Accepted formats: PDF, DOC, DOCX · Max 5 MB</span></button>
      <input ref={input} type="file" aria-label="Choose resume" className="sr-only" tabIndex={-1} accept=".pdf,.doc,.docx" disabled={busy} onChange={(event) => { select(event.target.files); event.target.value = '' }} />
    </div>
    <p id="resume-error" role={fileError ? 'alert' : undefined} className="text-xs text-red-600">{fileError}</p>
    {profile.resume && <div className="flex min-w-0 items-center gap-3 rounded-lg border border-ink-200 p-3"><FileText className="shrink-0 text-green-600" size={24} /><div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold text-ink-900">{profile.resume.name}</p><p className="mt-1 text-xs text-ink-400">{(profile.resume.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p></div><CheckCircle2 size={18} className="shrink-0 text-green-600" /><button type="button" aria-label="Remove resume" disabled={busy} className="rounded p-1 text-ink-600 hover:bg-ink-50" onClick={() => { updateSection('resume', null); setFileError('') }}><X size={18} /></button></div>}
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700"><Info size={16} className="mt-0.5 shrink-0" />Your resume can be added now or later during onboarding. It is not required to continue.</p>
  </CandidateProfileLayout>
}
