import React, { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, Bookmark, CheckCircle2, Download, Eye, FileText, LockKeyhole, Mail, MapPin, Phone, Send, UnlockKeyhole } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getErrorText } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

export default function RecruiterCandidateProfile() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    recruiterApi.getCandidate(candidateId).then((payload) => { if (active) setData(payload?.data || payload) }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [candidateId, reload])

  if (loading) return <RecruiterLoading label="Loading candidate profile…" />
  if (error) return <div className="flex flex-col gap-4"><RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} /><Link to="/recruiter/find-candidates" className="text-sm font-semibold text-blue-600">Back to candidate search</Link></div>
  const candidate = data?.candidate
  const profile = data?.profile || {}
  if (!candidate) return <RecruiterEmpty>Candidate profile is unavailable.</RecruiterEmpty>
  const unlocked = Boolean(data?.access?.unlocked)
  const contact = profile.contact || {}
  const experience = Array.isArray(profile.workExperience) ? profile.workExperience : []
  const career = Array.isArray(profile.career) ? profile.career : []
  const skills = Array.isArray(profile.skills) ? profile.skills : (candidate.tags || [])

  const addToShortlist = async () => {
    setBusy(true); setActionError('')
    try { await recruiterApi.addShortlistedCandidate(candidate.publicId || candidate.id); setData((current) => ({ ...current, candidate: { ...current.candidate, shortlisted: true } })) }
    catch (requestError) { setActionError(getErrorText(requestError)) }
    finally { setBusy(false) }
  }
  const unlock = async () => {
    setBusy(true); setActionError('')
    try {
      const payload = await recruiterApi.unlockCandidate(candidate.publicId || candidate.id, window.crypto?.randomUUID?.())
      const result = payload?.data || payload
      if (result?.unlocked !== true) throw new Error('The server did not confirm this profile unlock.')
      setData((current) => ({ ...current, ...result, candidate: result.candidate || current.candidate, profile: result.profile || current.profile, access: { ...current.access, unlocked: true }, creditBalance: result.creditBalance || current.creditBalance }))
      setUnlockModalOpen(false)
    } catch (requestError) { setActionError(getErrorText(requestError)) }
    finally { setBusy(false) }
  }
  const resumeUrl = unlocked ? profile.resume?.downloadUrl : null

  return <div className="flex flex-col gap-5">
    <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div className="flex min-w-0 items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-white">{candidate.initials || '—'}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{unlocked ? (contact.fullName || candidate.name) : `Candidate ${candidate.publicId || candidate.id}`}</h1>{unlocked && <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}<Badge tone="teal" className="normal-case tracking-normal">Verified Credentials</Badge></div><p className="mt-1 text-sm text-slate-600">{candidate.title} · {candidate.specialty} · {candidate.location} · {candidate.experience}</p></div></div><div className="flex flex-wrap items-center gap-3 xl:justify-end"><button type="button" onClick={() => navigate('/recruiter/find-candidates')} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><ArrowLeft className="h-3.5 w-3.5" />Back to Search</button><button type="button" disabled={busy || candidate.shortlisted} onClick={addToShortlist} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:opacity-50"><Bookmark className="h-3.5 w-3.5" fill={candidate.shortlisted ? 'currentColor' : 'none'} />{candidate.shortlisted ? 'Shortlisted' : 'Add to Shortlist'}</button>{unlocked && contact.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" />Contact Candidate</a>}{!unlocked && <button type="button" onClick={() => setUnlockModalOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><UnlockKeyhole className="h-4 w-4" />Unlock Full Profile</button>}</div></div></section>
    {actionError && <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{actionError}</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]"><div className="flex min-w-0 flex-col gap-5"><ProfileSection title="Professional Summary"><p className="text-sm leading-5 text-slate-700">{profile.summary || 'No professional summary is available.'}</p></ProfileSection>
      {unlocked && profile.resume && <ProfileSection title="Resume & Documents"><div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FileText className="h-6 w-6 text-slate-600" /><div><p className="text-sm font-semibold text-slate-900">{profile.resume.name || 'Resume'}</p><p className="text-xs text-slate-500">{profile.resume.meta || ''}</p></div></div>{resumeUrl && <a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Download className="h-3.5 w-3.5" />Open Resume</a>}</div></ProfileSection>}
      {experience.length > 0 && <ProfileSection title="Work Experience"><div className="flex flex-col gap-4">{experience.map((item, index) => <React.Fragment key={item.id || `${item.title}-${index}`}><div className="flex flex-col gap-1.5"><div className="flex flex-col justify-between gap-1 sm:flex-row"><h3 className="text-sm font-bold text-slate-900">{item.title || item.role}</h3><span className="text-xs text-slate-500">{item.dates || item.period}</span></div><p className="text-xs font-medium text-slate-600">{item.company}{item.location ? ` · ${item.location}` : ''}</p><p className="text-xs leading-5 text-slate-600">{item.description}</p></div>{index < experience.length - 1 && <div className="border-t border-slate-100" />}</React.Fragment>)}</div></ProfileSection>}
      <ProfileSection title="Skills">{skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{skill}</span>)}</div> : <p className="text-sm text-slate-500">No skills are available.</p>}</ProfileSection></div>
      <div className="flex flex-col gap-5"><section className={`rounded-xl border border-slate-200 p-5 ${unlocked ? 'bg-green-50' : 'bg-slate-50'}`}><h2 className="text-xl font-semibold text-slate-900">Contact Information</h2>{!unlocked && <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4" />Unlock profile to view contact information</div>}<div className={`mt-4 flex flex-col gap-2.5 ${unlocked ? '' : 'opacity-60'}`}><ContactRow label="Full Name" value={unlocked ? contact.fullName : 'Hidden'} icon={Eye} /><ContactRow label="Email" value={unlocked ? contact.email : 'Hidden'} icon={Mail} /><ContactRow label="Phone" value={unlocked ? contact.phone : 'Hidden'} icon={Phone} /><ContactRow label="Address" value={unlocked ? contact.address : 'Hidden'} icon={MapPin} /></div></section><ProfileSection title="Career Preferences">{career.length ? <dl className="flex flex-col gap-3">{career.map((item) => <div key={item.label} className="flex items-start justify-between gap-4 text-xs"><dt className="text-slate-500">{item.label}</dt><dd className="text-right font-semibold text-slate-800">{item.value}</dd></div>)}</dl> : <p className="text-sm text-slate-500">No preferences are available.</p>}</ProfileSection></div></div>
    {unlockModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5"><section role="dialog" aria-modal="true" aria-labelledby="unlock-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="unlock-title" className="text-xl font-bold text-slate-900">Unlock candidate profile?</h2><p className="mt-3 text-sm text-slate-600">Unlock cost: {data?.access?.unlockCost ?? '—'} credits. Available balance: {data?.creditBalance?.available ?? '—'} credits.</p>{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}<div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={unlock} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Unlocking…' : 'Confirm Unlock'}</button><button type="button" disabled={busy} onClick={() => setUnlockModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button></div></section></div>}
  </div>
}

function ProfileSection({ title, children }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold text-slate-900">{title}</h2><div className="mt-3.5">{children}</div></section> }
function ContactRow({ label, value, icon: Icon }) { return <div className="flex items-start justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</span><span className="text-right font-semibold text-slate-800">{value || '—'}</span></div> }
