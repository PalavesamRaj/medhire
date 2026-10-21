import React, { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, Bookmark, CheckCircle2, Download, Eye, FileText, LockKeyhole, Mail, MapPin, Phone, Send, UnlockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getErrorText } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

function unwrapResponse(value) {
  let result = value
  for (let depth = 0; depth < 5 && result && !Array.isArray(result); depth += 1) {
    if (result.data && typeof result.data === 'object') result = result.data
    else if (result.result && typeof result.result === 'object') result = result.result
    else break
  }
  return result
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function asList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeSkill(item) {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  if (!item || typeof item !== 'object') return ''
  return String(firstValue(item.name, item.skillName, item.skill_name, item.label, item.title, item.value, item.skill) || '')
}

function normalizeCareerItem(item) {
  if (typeof item === 'string' || typeof item === 'number') return { label: 'Preference', value: String(item) }
  if (!item || typeof item !== 'object') return null
  return {
    label: String(firstValue(item.label, item.name, item.type, item.key, item.category) || 'Preference'),
    value: String(firstValue(item.value, item.preference, item.description, item.name) || ''),
  }
}

function normalizeExperienceItem(item) {
  if (!item || typeof item !== 'object') return { title: String(item || '') }
  return {
    ...item,
    title: firstValue(item.title, item.role, item.position, item.jobTitle, item.job_title) || '',
    company: firstValue(item.company, item.employer, item.organization, item.hospital) || '',
    dates: firstValue(item.dates, item.period, item.duration, item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : item.startDate) || '',
    location: firstValue(item.location, item.city) || '',
    description: firstValue(item.description, item.summary, item.responsibilities) || '',
  }
}

function normalizeCandidateProfile(result = {}, candidate = {}, fallback = {}) {
  const raw = result.profile ?? result.candidateDetails ?? result.candidate_details ?? result.professionalProfile ?? result.professional_profile ?? {}
  const profile = raw.profile ?? raw.professionalProfile ?? raw.professional_profile ?? raw
  const rawContact = profile.contact ?? profile.contactInformation ?? profile.contact_information ?? profile.contactDetails ?? profile.contact_details ?? {}
  const contact = Object.keys(rawContact).length ? rawContact : candidate.contact ?? {}
  const skills = asList(firstValue(profile.skills, profile.skillSet, profile.skill_set, profile.tags, candidate.skills, candidate.tags, fallback.tags)).map(normalizeSkill).filter(Boolean)
  const workExperience = asList(firstValue(profile.workExperience, profile.work_experience, profile.experienceHistory, profile.experience_history, profile.experiences)).map(normalizeExperienceItem).filter((item) => item.title || item.company || item.description)
  const career = asList(firstValue(profile.career, profile.careerPreferences, profile.career_preferences, profile.preferences, profile.jobPreferences, profile.job_preferences)).map(normalizeCareerItem).filter((item) => item?.value)
  const summary = firstValue(profile.summary, profile.professionalSummary, profile.professional_summary, profile.about, profile.bio, candidate.summary, candidate.professionalSummary, candidate.professional_summary, fallback.summary) || ''
  return {
    ...profile,
    summary,
    skills,
    workExperience,
    career,
    contact,
    resume: profile.resume ?? profile.cv ?? profile.resumeDetails ?? profile.resume_details ?? null,
  }
}

function getAvailableCredits(...responses) {
  for (const response of responses) {
    const root = unwrapResponse(response)
    const values = [root?.creditBalance, root?.credit_balance, root?.balance, root?.credits, root]
    for (const value of values) {
      const available = typeof value === 'number' || typeof value === 'string'
        ? value
        : value?.available ?? value?.availableCredits ?? value?.available_credits ?? value?.creditsAvailable ?? value?.credits_available ?? value?.remaining
      if (available !== undefined && available !== null && available !== '') {
        const number = Number(available)
        if (Number.isFinite(number)) return { available: number }
      }
    }
  }
  return null
}

function getUnlockCost(...responses) {
  for (const response of responses) {
    const root = unwrapResponse(response)
    const access = root?.access ?? root?.accessDetails ?? root?.access_details ?? {}
    const raw = access.unlockCost ?? access.unlock_cost ?? access.creditsRequired ?? access.credits_required ?? root?.unlockCost ?? root?.unlock_cost
    if (raw !== undefined && raw !== null && raw !== '') {
      const number = Number(raw)
      if (Number.isFinite(number)) return number
    }
  }
  return null
}

export default function RecruiterCandidateProfile() {
  const { candidateId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resumeBusy, setResumeBusy] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [reload, setReload] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    Promise.allSettled([recruiterApi.getCandidate(candidateId), recruiterApi.getCreditBalance()]).then(([profileResponse, creditsResponse]) => {
      if (!active) return
      const payload = profileResponse.status === 'fulfilled' ? profileResponse.value : null
      const creditsPayload = creditsResponse.status === 'fulfilled' ? creditsResponse.value : null
      const result = unwrapResponse(payload)
      const responseCandidate = result?.candidate ?? result?.candidateProfile ?? result?.candidate_profile ?? result?.profile?.candidate ?? (result?.profile?.id || result?.profile?.candidateId || result?.profile?.title || result?.profile?.specialty ? result.profile : null) ?? (result?.id || result?.candidateId || result?.title || result?.specialty ? result : null)
      const candidate = responseCandidate && Object.keys(responseCandidate).length
        ? { ...(location.state?.candidate || {}), ...responseCandidate }
        : location.state?.candidate || null
      if (candidate) {
        const summary = {
          ...candidate,
          id: candidate.id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.publicId ?? candidate.public_id,
          publicId: candidate.publicId ?? candidate.public_id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.id,
          title: firstValue(candidate.title, candidate.jobTitle, candidate.job_title, candidate.roleTitle, candidate.profession, candidate.designation, location.state?.candidate?.title) || '',
          specialty: firstValue(candidate.specialty, candidate.specialtyName, candidate.specialty_name, location.state?.candidate?.specialty) || '',
          location: typeof candidate.location === 'object' ? [candidate.location.city, candidate.location.state].filter(Boolean).join(', ') : firstValue(candidate.location, candidate.city, location.state?.candidate?.location) || '',
          experience: formatProfileExperience(firstValue(candidate.experienceYears, candidate.experience_years, candidate.yearsOfExperience, candidate.experience, location.state?.candidate?.experience) || ''),
          initials: firstValue(candidate.initials, location.state?.candidate?.initials) || '',
        }
        const access = result.access ?? result.accessDetails ?? result.access_details ?? {}
        const unlockCost = getUnlockCost(result)
        const creditBalance = getAvailableCredits(result, creditsPayload)
        const profile = normalizeCandidateProfile(result, summary, location.state?.candidate || {})
        setData({ ...result, candidate: summary, profile, access: { ...access, ...(unlockCost !== null ? { unlockCost } : {}) }, creditBalance: creditBalance ?? result.creditBalance ?? result.credit_balance ?? null })
        const hasProfessionalDetails = Boolean(profile.summary || profile.skills.length || profile.workExperience.length || profile.career.length)
        setNotice(hasProfessionalDetails ? '' : 'The candidate detail response did not include a professional summary, skills, experience, or career preferences. Ask the backend team to return these fields in the documented profile response.')
      } else if (location.state?.candidate) {
        setData({ candidate: location.state.candidate, profile: {}, access: {}, creditBalance: getAvailableCredits(creditsPayload) })
        setNotice('The candidate summary loaded, but the profile endpoint did not return the documented candidate profile. Ask the backend team to return { candidate, profile, access, creditBalance }.')
      } else {
        setError(profileResponse.status === 'rejected' ? profileResponse.reason : new Error('The candidate profile response did not include a candidate object.'))
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [candidateId, reload, location.state])

  if (loading) return <RecruiterLoading label="Loading candidate profile…" />
  if (error) return <div className="flex flex-col gap-4"><RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} /><Link to="/recruiter/find-candidates" className="text-sm font-semibold text-blue-600">Back to candidate search</Link></div>
  const candidate = data?.candidate
  const profile = data?.profile || {}
  if (!candidate) return <RecruiterEmpty>Candidate profile is unavailable.</RecruiterEmpty>
  const unlocked = Boolean(data?.access?.unlocked ?? candidate.unlocked)
  const availableCredits = getAvailableCredits(data)?.available ?? null
  const unlockCost = getUnlockCost(data)
  const creditBalanceKnown = availableCredits !== null
  const unlockCostKnown = unlockCost !== null
  const canUnlock = creditBalanceKnown && unlockCostKnown && availableCredits >= unlockCost
  const contact = profile.contact || candidate.contact || {}
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
    if (!canUnlock) {
      setActionError(creditBalanceKnown && unlockCostKnown ? 'There are not enough credits to unlock this profile.' : 'The credit balance or unlock cost is unavailable. Check Plans & Credits before trying again.')
      return
    }
    setBusy(true); setActionError('')
    try {
      const payload = await recruiterApi.unlockCandidate(candidate.publicId || candidate.id, window.crypto?.randomUUID?.())
      const result = unwrapResponse(payload)
      if (result?.unlocked !== true) throw new Error('The server did not confirm this profile unlock.')
      const balance = getAvailableCredits(result)
      setData((current) => ({ ...current, ...result, candidate: result.candidate || current.candidate, profile: result.profile || current.profile, access: { ...current.access, unlocked: true }, creditBalance: balance ?? current.creditBalance }))
      setUnlockModalOpen(false)
    } catch (requestError) {
      if (String(requestError.code || '').toUpperCase() === 'INSUFFICIENT_CREDITS') {
        const balance = await recruiterApi.getCreditBalance().then(getAvailableCredits).catch(() => null)
        if (balance) setData((current) => ({ ...current, creditBalance: balance }))
      }
      setActionError(getErrorText(requestError))
    }
    finally { setBusy(false) }
  }
  const downloadResume = async () => {
    const resume = profile.resume
    const resumeId = resume?.resumeId || resume?.id
    if (!resumeId) { setActionError('A secure resume download is not available for this candidate.'); return }
    setResumeBusy(true); setActionError('')
    try {
      const blob = await recruiterApi.downloadCandidateResume(candidate.candidateId || candidate.id, resumeId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = resume.fileName || resume.name || 'candidate-resume'
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (requestError) { setActionError(getErrorText(requestError)) }
    finally { setResumeBusy(false) }
  }

  return <div className="flex flex-col gap-5">
    {notice && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
    <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div className="flex min-w-0 items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-white">{candidate.initials || '—'}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{unlocked ? (contact.fullName || candidate.name || candidate.title) : (candidate.title || 'Candidate Profile')}</h1>{unlocked && <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}<Badge tone="teal" className="normal-case tracking-normal">Verified Credentials</Badge></div><p className="mt-1 text-sm text-slate-600">{[candidate.title, candidate.specialty, candidate.location, candidate.experience].filter(Boolean).join(' · ')}</p></div></div><div className="flex flex-wrap items-center gap-3 xl:justify-end"><button type="button" onClick={() => navigate('/recruiter/find-candidates')} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><ArrowLeft className="h-3.5 w-3.5" />Back to Search</button><button type="button" disabled={busy || candidate.shortlisted} onClick={addToShortlist} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:opacity-50"><Bookmark className="h-3.5 w-3.5" fill={candidate.shortlisted ? 'currentColor' : 'none'} />{candidate.shortlisted ? 'Shortlisted' : 'Add to Shortlist'}</button>{unlocked && contact.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" />Contact Candidate</a>}{!unlocked && <button type="button" onClick={() => setUnlockModalOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><UnlockKeyhole className="h-4 w-4" />Unlock Full Profile</button>}</div></div></section>
    {actionError && <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{actionError}</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]"><div className="flex min-w-0 flex-col gap-5"><ProfileSection title="Professional Summary"><p className="text-sm leading-5 text-slate-700">{profile.summary || 'No professional summary is available.'}</p></ProfileSection>
      {unlocked && profile.resume && <ProfileSection title="Resume & Documents"><div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FileText className="h-6 w-6 text-slate-600" /><div><p className="text-sm font-semibold text-slate-900">{profile.resume.fileName || profile.resume.name || 'Resume'}</p><p className="text-xs text-slate-500">{profile.resume.meta || ''}</p></div></div><button type="button" disabled={resumeBusy} onClick={downloadResume} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Download className="h-3.5 w-3.5" />{resumeBusy ? 'Downloading…' : 'Download Resume'}</button></div></ProfileSection>}
      {experience.length > 0 && <ProfileSection title="Work Experience"><div className="flex flex-col gap-4">{experience.map((item, index) => <React.Fragment key={item.id || `${item.title}-${index}`}><div className="flex flex-col gap-1.5"><div className="flex flex-col justify-between gap-1 sm:flex-row"><h3 className="text-sm font-bold text-slate-900">{item.title || item.role}</h3><span className="text-xs text-slate-500">{item.dates || item.period}</span></div><p className="text-xs font-medium text-slate-600">{item.company}{item.location ? ` · ${item.location}` : ''}</p><p className="text-xs leading-5 text-slate-600">{item.description}</p></div>{index < experience.length - 1 && <div className="border-t border-slate-100" />}</React.Fragment>)}</div></ProfileSection>}
      <ProfileSection title="Skills">{skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{skill}</span>)}</div> : <p className="text-sm text-slate-500">No skills are available.</p>}</ProfileSection></div>
      <div className="flex flex-col gap-5"><section className={`rounded-xl border border-slate-200 p-5 ${unlocked ? 'bg-green-50' : 'bg-slate-50'}`}><h2 className="text-xl font-semibold text-slate-900">Contact Information</h2>{!unlocked && <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4" />Unlock profile to view contact information</div>}<div className={`mt-4 flex flex-col gap-2.5 ${unlocked ? '' : 'opacity-60'}`}><ContactRow label="Full Name" value={unlocked ? contact.fullName : 'Hidden'} icon={Eye} /><ContactRow label="Email" value={unlocked ? contact.email : 'Hidden'} icon={Mail} /><ContactRow label="Phone" value={unlocked ? contact.phone : 'Hidden'} icon={Phone} /><ContactRow label="Address" value={unlocked ? contact.address : 'Hidden'} icon={MapPin} /></div></section><ProfileSection title="Career Preferences">{career.length ? <dl className="flex flex-col gap-3">{career.map((item) => <div key={item.label} className="flex items-start justify-between gap-4 text-xs"><dt className="text-slate-500">{item.label}</dt><dd className="text-right font-semibold text-slate-800">{item.value}</dd></div>)}</dl> : <p className="text-sm text-slate-500">No preferences are available.</p>}</ProfileSection></div></div>
    {unlockModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5"><section role="dialog" aria-modal="true" aria-labelledby="unlock-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="unlock-title" className="text-xl font-bold text-slate-900">Unlock candidate profile?</h2><p className="mt-3 text-sm text-slate-600">Unlock cost: {unlockCostKnown ? unlockCost : 'Unavailable'} credits. Available balance: {creditBalanceKnown ? availableCredits : 'Unavailable'} credits.</p>{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}{!canUnlock && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{creditBalanceKnown && unlockCostKnown ? 'Your credit balance is too low to unlock this profile.' : 'The credit balance or unlock cost could not be loaded.'} <Link to="/recruiter/plans-credits" onClick={() => setUnlockModalOpen(false)} className="ml-1 font-semibold underline">View Plans & Credits</Link></div>}<div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy || !canUnlock} onClick={unlock} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Unlocking…' : canUnlock ? 'Confirm Unlock' : 'Insufficient Credits'}</button><button type="button" disabled={busy} onClick={() => setUnlockModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button></div></section></div>}
  </div>
}

function ProfileSection({ title, children }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold text-slate-900">{title}</h2><div className="mt-3.5">{children}</div></section> }
function ContactRow({ label, value, icon: Icon }) { return <div className="flex items-start justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</span><span className="text-right font-semibold text-slate-800">{value || '—'}</span></div> }
function formatProfileExperience(value) {
  if (value == null || value === '') return ''
  const numeric = typeof value === 'number' ? value : /^\d+(?:\.\d+)?$/.test(String(value).trim()) ? Number(value) : null
  if (numeric !== null) return numeric <= 0 ? '' : `${numeric} ${numeric === 1 ? 'year' : 'years'} experience`
  return String(value)
}
