import React, { useEffect, useRef, useState } from 'react'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'
import CandidateIcon from '../../components/candidate/dashboard/CandidateIcon'
import ConfirmDialog from '../../components/candidate/dashboard/ConfirmDialog'
import { formatDate } from '../../components/candidate/dashboard/JobCard'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import { validateResumeUpload } from '../../lib/candidateDashboardValidation'
import { VALIDATION_CONFIG } from '../../lib/validationConfig'

function ResumeRow({ resume, onRemove, onActivate }) {
  const [url, setUrl] = useState(resume.url || '')
  useEffect(() => {
    if (!resume.file) return
    const fileUrl = URL.createObjectURL(resume.file)
    setUrl(fileUrl)
    return () => URL.revokeObjectURL(fileUrl)
  }, [resume.file])
  return <tr className="border-t border-ink-200"><td className="py-6 pr-4"><div className="flex items-center gap-2"><CandidateIcon name="file-text" className="h-4 w-4 text-ink-400" /><span className="med-body break-all font-semibold">{resume.name}</span></div></td><td className="med-caption whitespace-nowrap py-6 pr-4 text-ink-600">{formatDate(resume.uploaded)}</td><td className="py-6 pr-4"><div className="flex flex-wrap gap-2"><StatusBadge status={resume.status} />{resume.active && <StatusBadge status="Active" />}</div></td><td className="py-6"><div className="flex flex-wrap gap-x-3 gap-y-2">{url && <><a href={url} target="_blank" rel="noreferrer" className="med-caption font-semibold text-brand-600" aria-label={`View ${resume.name}`}>View</a><a href={url} download={resume.name} className="med-caption font-semibold text-brand-600" aria-label={`Download ${resume.name}`}>Download</a></>}{resume.status === 'Approved' && !resume.active && <button type="button" onClick={onActivate} className="!text-xs text-brand-600">Make active</button>}<button type="button" aria-label={`Remove ${resume.name}`} onClick={onRemove} className="!text-xs text-red-600">Remove</button></div></td></tr>
}
export default function ResumeManagement() {
  const { resumes, dispatch } = useCandidateDashboard()
  const toast = useToast()
  const input = useRef(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const select = (file) => {
    if (!file) return
    const errors = validateResumeUpload(file)
    setError(errors.resume || '')
    setSelected(errors.resume ? null : file)
  }
  const upload = () => {
    const errors = validateResumeUpload(selected)
    setError(errors.resume || '')
    if (errors.resume || !selected) return
    dispatch({ type: 'add-resume', resume: { id: crypto.randomUUID(), name: selected.name, uploaded: new Date().toISOString(), status: 'Pending Review', active: false, file: selected } })
    setSelected(null)
    toast('Resume added for this session. Status: pending review.')
  }
  return <><PageHeading title="Resume Management" subtitle="Your resume history"><Button onClick={() => input.current?.click()}>Upload New Resume</Button></PageHeading>
    <input ref={input} type="file" aria-label="Upload new resume" className="sr-only" tabIndex={-1} accept={VALIDATION_CONFIG.enabled ? '.pdf,.doc,.docx' : undefined} onChange={(event) => { select(event.target.files?.[0]); event.target.value = '' }} />
    {error && <p role="alert" className="med-body text-red-600">{error}</p>}
    {selected && <div className="med-card flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="med-body break-all font-semibold">{selected.name}</p><p className="med-caption text-ink-600">{(selected.size / 1024 / 1024).toFixed(2)} MB · Ready to add</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={upload}>Add Resume</Button></div></div>}
    <section className="med-card"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><caption className="sr-only">Resume history and actions</caption><thead><tr className="med-caption text-ink-400"><th className="pb-3 pr-4 font-semibold">FILE</th><th className="pb-3 pr-4 font-semibold">UPLOADED</th><th className="pb-3 pr-4 font-semibold">STATUS</th><th className="pb-3 font-semibold">ACTIONS</th></tr></thead><tbody>{resumes.map((resume) => <ResumeRow key={resume.id} resume={resume} onRemove={() => setRemoving(resume)} onActivate={() => { dispatch({ type: 'activate-resume', id: resume.id }); toast('Active resume updated.') }} />)}</tbody></table></div>{!resumes.length && <p className="med-body py-8 text-center text-ink-600">No resumes yet. Upload a PDF, DOC, or DOCX to get started.</p>}<p className="med-caption border-t border-ink-200 pt-4 text-ink-400">Only one approved resume can be active at a time. New uploads require review. Maximum file size: 5 MB.</p><p className="med-caption mt-2 text-ink-400">Demo resumes use a local sample PDF. New files stay in this tab and are cleared on refresh.</p></section>
    {removing && <ConfirmDialog title="Remove resume?" confirmLabel="Remove Resume" onClose={() => setRemoving(null)} onConfirm={() => { dispatch({ type: 'remove-resume', id: removing.id }); setRemoving(null); toast('Resume removed from this session.') }}><p className="break-all">Remove {removing.name} from your resume history? Existing applications will remain listed.</p></ConfirmDialog>}
  </>
}
