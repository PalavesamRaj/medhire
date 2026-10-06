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
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'

function ResumeRow({ resume, onRemove }) {
  const [url, setUrl] = useState(resume.url || '')
  useEffect(() => {
    if (!resume.file) return
    const fileUrl = URL.createObjectURL(resume.file)
    setUrl(fileUrl)
    return () => URL.revokeObjectURL(fileUrl)
  }, [resume.file])
  return <tr className="border-t border-ink-200"><td className="py-6 pr-4"><div className="flex items-center gap-2"><CandidateIcon name="file-text" className="h-4 w-4 text-ink-400" /><span className="med-body break-all font-semibold">{resume.name}</span></div></td><td className="med-caption whitespace-nowrap py-6 pr-4 text-ink-600">{resume.uploaded ? formatDate(resume.uploaded) : '—'}</td><td className="py-6 pr-4"><div className="flex flex-wrap gap-2"><StatusBadge status={resume.status} />{resume.active && <StatusBadge status="Active" />}</div></td><td className="py-6"><div className="flex flex-wrap gap-x-3 gap-y-2">{url && <><a href={url} target="_blank" rel="noreferrer" className="med-caption font-semibold text-brand-600" aria-label={`View ${resume.name}`}>View</a><a href={url} download={resume.name} className="med-caption font-semibold text-brand-600" aria-label={`Download ${resume.name}`}>Download</a></>}<button type="button" aria-label={`Remove ${resume.name}`} onClick={onRemove} className="!text-xs text-red-600">Remove</button></div></td></tr>
}
export default function ResumeManagement() {
  const { resumes, dispatch } = useCandidateDashboard()
  const toast = useToast()
  const input = useRef(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)
  const select = (file) => {
    if (!file) return
    const errors = validateResumeUpload(file)
    setError(errors.resume || '')
    setSelected(errors.resume ? null : file)
  }
  const upload = async () => {
    const errors = validateResumeUpload(selected)
    setError(errors.resume || '')
    if (errors.resume || !selected || busy) return
    setBusy(true)
    try {
      const response = await candidateDashboardApi.uploadResume(selected)
      const data = response?.data || response || {}
      const item = data.resume || data
      dispatch({ type: 'add-resume', resume: { ...item, id: item.id || item.resumeId, name: item.name || item.fileName || selected.name, uploaded: item.uploaded || item.uploadedAt || new Date().toISOString(), status: item.status || item.approvalStatus || 'Pending Review', active: Boolean(item.active) } })
      setSelected(null)
      toast('Resume uploaded successfully.')
    } catch (requestError) { setError(requestError.message || 'Unable to upload this resume.') }
    finally { setBusy(false) }
  }
  const confirmRemove = async () => {
    if (!removing || busy) return
    setBusy(true)
    try {
      await candidateDashboardApi.deleteResume(removing.id)
      dispatch({ type: 'remove-resume', id: removing.id })
      setRemoving(null)
      toast('Resume removed.')
    } catch (requestError) { setError(requestError.message || 'Unable to remove this resume.') }
    finally { setBusy(false) }
  }
  return <><PageHeading title="Resume Management" subtitle="Your resume history"><Button onClick={() => input.current?.click()} disabled={busy}>Upload New Resume</Button></PageHeading>
    <input ref={input} type="file" aria-label="Upload new resume" className="sr-only" tabIndex={-1} accept={VALIDATION_CONFIG.enabled ? '.pdf,.doc,.docx' : undefined} onChange={(event) => { select(event.target.files?.[0]); event.target.value = '' }} />
    {error && <p role="alert" className="med-body text-red-600">{error}</p>}
    {selected && <div className="med-card flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="med-body break-all font-semibold">{selected.name}</p><p className="med-caption text-ink-600">{(selected.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>Cancel</Button><Button onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload Resume'}</Button></div></div>}
    <section className="med-card"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><caption className="sr-only">Resume history and actions</caption><thead><tr className="med-caption text-ink-400"><th className="pb-3 pr-4 font-semibold">FILE</th><th className="pb-3 pr-4 font-semibold">UPLOADED</th><th className="pb-3 pr-4 font-semibold">STATUS</th><th className="pb-3 font-semibold">ACTIONS</th></tr></thead><tbody>{resumes.map((resume) => <ResumeRow key={resume.id} resume={resume} onRemove={() => setRemoving(resume)} />)}</tbody></table></div>{!resumes.length && <p className="med-body py-8 text-center text-ink-600">No resumes yet. Upload a PDF, DOC, or DOCX to get started.</p>}<p className="med-caption border-t border-ink-200 pt-4 text-ink-400">Only one approved resume can be active at a time. New uploads require review. Maximum file size: 5 MB.</p></section>
    {removing && <ConfirmDialog title="Remove resume?" confirmLabel={busy ? 'Removing…' : 'Remove Resume'} onClose={() => { if (!busy) setRemoving(null) }} onConfirm={confirmRemove}><p className="break-all">Remove {removing.name} from your resume history? Existing applications will remain listed.</p></ConfirmDialog>}
  </>
}
