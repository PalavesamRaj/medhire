import React, { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Eye, FileText, LockKeyhole, Mail, MapPin, Phone, Send, UnlockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getErrorText, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'
import { isCandidateContacted, markCandidateContacted } from '../../lib/recruiterCandidateContact'

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

function firstPopulated(...values) {
  return values.find((value) => {
    if (value === undefined || value === null || value === '') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })
}

function extractCandidate(result) {
  return result?.candidate ?? result?.candidateProfile ?? result?.candidate_profile ?? result?.profile?.candidate ??
    (result?.profile?.id || result?.profile?.candidateId || result?.profile?.title || result?.profile?.specialty ? result.profile : null) ??
    (result?.id || result?.candidateId || result?.candidate_id || result?.title || result?.specialty || result?.currentJobTitle ? result : null)
}

function asList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  if (value && typeof value === 'object') {
    const nested = firstValue(value.items, value.results, value.values, value.skills, value.data)
    if (nested !== undefined) return asList(nested)
    if (firstValue(value.name, value.skillName, value.skill_name, value.label, value.title, value.value, value.skill, value.skillLabel, value.skill_label) !== undefined) return [value]
  }
  return []
}

function normalizeSkill(item) {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  if (!item || typeof item !== 'object') return ''
  const value = firstValue(item.name, item.skillName, item.skill_name, item.label, item.title, item.value, item.skill, item.skillLabel, item.skill_label, item.displayName, item.display_name, item.text)
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object') return normalizeSkill(value)
  return ''
}

function normalizeCareerItem(item) {
  if (typeof item === 'string' || typeof item === 'number') return { label: 'Preference', value: String(item) }
  if (!item || typeof item !== 'object') return null
  return {
    label: String(firstValue(item.label, item.name, item.type, item.key, item.category) || 'Preference'),
    value: String(firstValue(item.value, item.preference, item.description, item.name) || ''),
  }
}

function normalizeCareerPreferences(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(normalizeCareerItem).filter((item) => item?.value)
  if (typeof value !== 'object') return []
  const scalar = (item) => Array.isArray(item) ? item.map(scalar).filter(Boolean).join(', ') : item && typeof item === 'object' ? scalar(firstValue(item.name, item.label, item.value, item.title, item.displayName, item.display_name) || '') : item == null ? '' : String(item)
  const rows = [
    ['Desired Role', value.desiredJobTitle ?? value.desired_job_title],
    ['Employment Type', value.employmentTypes ?? value.employmentType ?? value.employment_type],
    ['Preferred Specialties', value.preferredSpecialties ?? value.preferred_specialties],
    ['Preferred Location', value.preferredLocations ?? value.preferredLocation ?? value.preferred_locations ?? value.preferred_location],
    ['Work Setting', value.workSetting ?? value.work_setting ?? value.remotePreference ?? value.remote_preference],
    ['Shift Preference', value.shiftPreference ?? value.shift_preference],
    ['Salary Expectation', value.expectedSalary ?? value.expected_salary],
    ['Available From', value.availableFrom ?? value.available_from],
    ['Willing to Relocate', value.willingToRelocate ?? value.willing_to_relocate],
  ]
  const normalized = rows.map(([label, raw]) => ({ label, value: scalar(raw) })).filter((item) => item.value)
  const salary = normalized.find((item) => item.label === 'Salary Expectation')
  const salaryType = value.salaryType ?? value.salary_type
  if (salary && salaryType) salary.value = `${salary.value} / ${scalar(salaryType)}`
  return normalized
}

function normalizeExperienceItem(item) {
  if (!item || typeof item !== 'object') return { title: String(item || '') }
  const start = [item.startMonth, item.startYear].filter(Boolean).join(' | ')
  const currentlyWorking = item.currentlyWorking === true || String(item.currentlyWorking).toLowerCase() === 'true'
  const end = currentlyWorking ? 'Present' : [item.endMonth, item.endYear].filter(Boolean).join(' | ')
  const dateRange = start && end ? `${start} - ${end}` : start || end
  const rawLocation = firstValue(item.location, item.city)
  const location = rawLocation && typeof rawLocation === 'object'
    ? [rawLocation.city, rawLocation.state, rawLocation.country].filter(Boolean).join(', ')
    : rawLocation
  const rawEmploymentType = firstValue(item.employmentType, item.employment_type)
  return {
    ...item,
    title: firstValue(item.title, item.role, item.position, item.jobTitle, item.job_title) || '',
    company: firstValue(item.company, item.employer, item.employerName, item.employer_name, item.organization, item.hospital) || '',
    employmentType: rawEmploymentType && typeof rawEmploymentType === 'object' ? firstValue(rawEmploymentType.name, rawEmploymentType.label, rawEmploymentType.value) || '' : rawEmploymentType || '',
    dates: firstValue(item.dates, item.period, item.duration, item.startDate && item.endDate ? `${item.startDate} - ${item.endDate}` : item.startDate, dateRange) || '',
    location: typeof location === 'string' ? location : '',
    description: firstValue(item.description, item.summary, item.responsibilities) || '',
  }
}

function normalizeCandidateProfile(result = {}, candidate = {}, fallback = {}) {
  const raw = result.profile ?? result.candidateDetails ?? result.candidate_details ?? result.professionalProfile ?? result.professional_profile ?? candidate.profile ?? candidate.professionalProfile ?? candidate.professional_profile ?? {}
  const profile = raw.profile ?? raw.professionalProfile ?? raw.professional_profile ?? raw
  const rawContact = profile.contact ?? profile.contactInformation ?? profile.contact_information ?? profile.contactDetails ?? profile.contact_details ?? candidate.contact ?? candidate.contactInformation ?? candidate.contact_information ?? candidate.contactDetails ?? candidate.contact_details ?? {}
  const contact = {
    ...(rawContact || {}),
    fullName: firstValue(rawContact.fullName, rawContact.full_name, rawContact.name, rawContact.displayName, rawContact.display_name, candidate.fullName, candidate.full_name, candidate.displayName, candidate.display_name, candidate.candidateName, candidate.candidate_name),
    email: firstValue(rawContact.email, rawContact.contactEmail, rawContact.contact_email, candidate.email, candidate.contactEmail, candidate.contact_email),
    phone: firstValue(rawContact.phone, rawContact.phoneNumber, rawContact.phone_number, rawContact.mobile, candidate.phone, candidate.phoneNumber, candidate.phone_number, candidate.mobile),
    address: firstValue(rawContact.address, rawContact.fullAddress, rawContact.full_address, candidate.address, candidate.fullAddress, candidate.full_address),
    maskedFullName: firstValue(rawContact.maskedFullName, rawContact.masked_full_name, candidate.maskedFullName, candidate.masked_full_name),
    maskedEmail: firstValue(rawContact.maskedEmail, rawContact.masked_email, candidate.maskedEmail, candidate.masked_email),
    maskedPhone: firstValue(rawContact.maskedPhone, rawContact.masked_phone, candidate.maskedPhone, candidate.masked_phone),
    maskedAddress: firstValue(rawContact.maskedAddress, rawContact.masked_address, candidate.maskedAddress, candidate.masked_address),
  }
  const skills = asList(firstPopulated(profile.skills, profile.professionalSkills, profile.professional_skills, profile.candidateSkills, profile.candidate_skills, profile.skillNames, profile.skill_names, profile.skillSet, profile.skill_set, profile.skill, profile.tags, candidate.skills, candidate.professionalSkills, candidate.professional_skills, candidate.candidateSkills, candidate.candidate_skills, candidate.skillNames, candidate.skill_names, candidate.skillSet, candidate.skill_set, candidate.skill, candidate.tags, fallback.tags)).map(normalizeSkill).filter((skill) => skill && skill !== '[object Object]')
  const workExperience = asList(firstPopulated(profile.workExperience, profile.work_experience, profile.experienceHistory, profile.experience_history, profile.experiences, candidate.workExperience, candidate.work_experience)).map(normalizeExperienceItem).filter((item) => item.title || item.company || item.description || item.dates || item.location || item.employmentType)
  const flatCareer = ['desiredJobTitle', 'desired_job_title', 'employmentTypes', 'employmentType', 'employment_type', 'preferredLocations', 'preferred_locations', 'shiftPreference', 'shift_preference', 'expectedSalary', 'expected_salary'].some((key) => candidate[key] !== undefined)
    ? candidate
    : null
  const career = normalizeCareerPreferences(firstPopulated(profile.career, profile.careerPreferences, profile.career_preferences, profile.preferences, profile.jobPreferences, profile.job_preferences, candidate.career, candidate.careerPreferences, candidate.career_preferences, fallback.careerPreferences, flatCareer))
  const professional = profile.professionalInformation ?? profile.professional_information ?? profile.professional ?? candidate.professionalInformation ?? candidate.professional_information ?? {}
  const summaryValue = firstValue(profile.summary, profile.professionalSummary, profile.professional_summary, profile.about, profile.bio, professional.professionalSummary, professional.professional_summary, candidate.summary, candidate.professionalSummary, candidate.professional_summary, fallback.summary)
  const summary = typeof summaryValue === 'string' || typeof summaryValue === 'number' ? String(summaryValue) : firstValue(summaryValue?.text, summaryValue?.value) || ''
  return {
    ...profile,
    summary,
    skills,
    workExperience,
    career,
    contact,
    resumes: normalizeResumes(firstPopulated(profile.resumes, profile.resumeLinks, profile.resume_links, profile.resumeFiles, profile.resume_files, profile.resume, profile.cv, profile.resumeDetails, profile.resume_details, candidate.resumes, candidate.resumeLinks, candidate.resume_links, candidate.resumeFiles, candidate.resume_files, candidate.resume)),
  }
}

function normalizeResumes(value) {
  if (value === undefined || value === null || value === '') return []
  const items = Array.isArray(value) ? value : [value]
  return items.map((item) => typeof item === 'string' ? { fileName: item } : item).filter((item) => item && typeof item === 'object')
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

function applicationCandidateId(application) {
  const candidate = application?.candidate ?? application?.applicant ?? application?.candidateProfile ?? application?.candidate_profile ?? {}
  return firstValue(application?.candidatePublicId, application?.candidate_public_id, application?.candidateId, application?.candidate_id,
    candidate.publicId, candidate.public_id, candidate.candidateId, candidate.candidate_id, candidate.id)
}

function applicationStatusLabel(status) {
  const normalized = String(status || '').toUpperCase().replaceAll(' ', '_')
  return ({ APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', HIRED: 'Hired', REJECTED: 'Rejected' })[normalized] || (status ? String(status).replaceAll('_', ' ') : 'Status unavailable')
}

function applicationStatusTone(status) {
  const normalized = String(status || '').toUpperCase().replaceAll(' ', '_')
  if (normalized === 'HIRED') return 'bg-green-50 text-green-700'
  if (normalized === 'REJECTED') return 'bg-red-50 text-red-700'
  if (normalized === 'INTERVIEW') return 'bg-violet-50 text-violet-700'
  if (normalized === 'SHORTLISTED') return 'bg-blue-50 text-blue-700'
  if (normalized === 'UNDER_REVIEW') return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-700'
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
  const [contacted, setContacted] = useState(() => isCandidateContacted(candidateId))
  const [jobApplications, setJobApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [applicationsError, setApplicationsError] = useState(false)

  useEffect(() => { setContacted(isCandidateContacted(candidateId)) }, [candidateId])

  useEffect(() => {
    let active = true
    setApplicationsLoading(true)
    setApplicationsError(false)
    setJobApplications([])
    const targetId = String(candidateId || '').trim().toLowerCase()
    const loadApplicationStatuses = async () => {
      try {
        const jobs = getListResponse(await recruiterApi.getJobs()).items
        const results = await Promise.allSettled(jobs.map(async (job) => {
          const jobId = job.id || job.jobId || job.job_id
          if (!jobId) return []
          const applications = getListResponse(await recruiterApi.getJobApplications(jobId)).items
          return applications
            .filter((application) => String(applicationCandidateId(application) || '').trim().toLowerCase() === targetId)
            .map((application) => ({
              id: application.applicationId || application.application_id || application.id,
              jobId,
              jobTitle: job.title || job.jobTitle || job.job_title || 'Job posting',
              status: application.status || application.applicationStatus || application.application_status,
              appliedAt: application.appliedAt || application.applied_at || application.createdAt || application.created_at,
            }))
        }))
        const failed = results.some((result) => result.status === 'rejected')
        const matches = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        if (active) {
          setJobApplications(matches)
          setApplicationsError(failed && matches.length === 0)
        }
      } catch {
        if (active) setApplicationsError(true)
      } finally {
        if (active) setApplicationsLoading(false)
      }
    }
    loadApplicationStatuses()
    return () => { active = false }
  }, [candidateId, reload])

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    Promise.allSettled([recruiterApi.getCandidate(candidateId), recruiterApi.getCreditBalance()]).then(([profileResponse, creditsResponse]) => {
      if (!active) return
      const payload = profileResponse.status === 'fulfilled' ? profileResponse.value : null
      const creditsPayload = creditsResponse.status === 'fulfilled' ? creditsResponse.value : null
      const result = unwrapResponse(payload)
      const responseCandidate = extractCandidate(result)
      const candidate = responseCandidate && Object.keys(responseCandidate).length
        ? { ...(location.state?.candidate || {}), ...responseCandidate }
        : location.state?.candidate || null
      if (candidate) {
        const summary = {
          ...candidate,
          id: candidate.id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.publicId ?? candidate.public_id,
          publicId: candidate.publicId ?? candidate.public_id ?? candidate.candidateId ?? candidate.candidate_id ?? candidate.id,
          title: firstValue(candidate.title, candidate.jobTitle, candidate.job_title, candidate.currentJobTitle, candidate.current_job_title, candidate.roleTitle, candidate.role_title, candidate.profession, candidate.designation, candidate.professionalInformation?.currentJobTitle, candidate.professional_information?.current_job_title, location.state?.candidate?.title) || '',
          specialty: firstValue(candidate.specialty, candidate.specialtyName, candidate.specialty_name, location.state?.candidate?.specialty) || '',
          location: typeof candidate.location === 'object' ? [candidate.location.city, candidate.location.state].filter(Boolean).join(', ') : firstValue(candidate.location, candidate.city, location.state?.candidate?.location) || '',
          experience: formatProfileExperience(firstValue(candidate.experienceYears, candidate.experience_years, candidate.yearsOfExperience, candidate.experience, location.state?.candidate?.experience) || ''),
          initials: firstValue(candidate.initials, location.state?.candidate?.initials) || '',
          availability: firstValue(candidate.availability, candidate.availabilityStatus, candidate.availability_status, location.state?.candidate?.availability) || '',
          employment: firstValue(candidate.employment, candidate.employmentType, candidate.employment_type, location.state?.candidate?.employment) || '',
          credentialsVerified: candidate.credentialsVerified === true || candidate.credentials_verified === true || candidate.verifiedCredentials === true || candidate.verified_credentials === true,
        }
        const access = result.access ?? result.accessDetails ?? result.access_details ?? {}
        const unlockCost = getUnlockCost(result)
        const creditBalance = getAvailableCredits(result, creditsPayload)
        const profile = normalizeCandidateProfile(result, summary, location.state?.candidate || {})
        setData({ ...result, candidate: summary, profile, access: { ...access, ...(unlockCost !== null ? { unlockCost } : {}) }, creditBalance: creditBalance ?? result.creditBalance ?? result.credit_balance ?? null })
        const missingPreviewSections = [
          !profile.summary && 'professional summary',
          !profile.workExperience.length && 'work experience',
          !profile.skills.length && 'skills',
          !profile.career.length && 'career preferences',
        ].filter(Boolean)
        if (profileResponse.status === 'rejected') {
          const status = profileResponse.reason?.status ? ` (HTTP ${profileResponse.reason.status})` : ''
          const reason = profileResponse.reason?.message ? ` ${profileResponse.reason.message}` : ''
          setNotice(`Could not load the candidate detail endpoint${status}.${reason} The visible title and location came from the search result; profile sections may be incomplete.`)
        } else {
          const profileLocked = !isProfileUnlocked(result, summary)
          setNotice(!profileLocked && missingPreviewSections.length
            ? `The unlocked candidate response did not include ${missingPreviewSections.join(', ')}.`
            : '')
        }
      } else if (location.state?.candidate) {
        setData({ candidate: location.state.candidate, profile: {}, access: {}, creditBalance: getAvailableCredits(creditsPayload) })
        setNotice('The candidate summary loaded, but the profile endpoint did not return a candidate record in its data object.')
      } else {
        setError(profileResponse.status === 'rejected' ? profileResponse.reason : new Error('The candidate profile response did not include a candidate object.'))
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [candidateId, reload, location.state])

  if (loading) return <RecruiterLoading label="Loading candidate profile..." />
  if (error) return <div className="flex flex-col gap-4"><RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} /><Link to="/recruiter/find-candidates" className="text-sm font-semibold text-blue-600">Back to candidate search</Link></div>
  const candidate = data?.candidate
  const profile = data?.profile || {}
  if (!candidate) return <RecruiterEmpty>Candidate profile is unavailable.</RecruiterEmpty>
  const unlocked = isProfileUnlocked(data, candidate)
  const availableCredits = getAvailableCredits(data)?.available ?? null
  const unlockCost = getUnlockCost(data)
  const creditBalanceKnown = availableCredits !== null
  const unlockCostKnown = unlockCost !== null
  const canUnlock = creditBalanceKnown && unlockCostKnown && availableCredits >= unlockCost
  const contact = profile.contact || {}
  const hasContactDetails = Boolean(contact.fullName || contact.email || contact.phone || contact.address)
  const experience = Array.isArray(profile.workExperience) ? profile.workExperience : []
  const career = Array.isArray(profile.career) ? profile.career : []
  const skills = Array.isArray(profile.skills) ? profile.skills : (candidate.tags || [])

  const unlock = async () => {
    if (!canUnlock) {
      setActionError(creditBalanceKnown && unlockCostKnown ? 'There are not enough credits to unlock this profile.' : 'The credit balance or unlock cost is unavailable. Check Plans & Credits before trying again.')
      return
    }
    setBusy(true); setActionError('')
    try {
      const unlockResponse = unwrapResponse(await recruiterApi.unlockCandidate(candidate.publicId || candidate.id, window.crypto?.randomUUID?.()))
      if (unlockResponse?.success === false) throw new Error(unlockResponse.message || 'The server could not unlock this profile.')

      // The unlock endpoint confirms the action but does not return the credit balance
      // or the full profile. Refetch both resources to obtain their current values.
      const [profileResult, creditsResult] = await Promise.allSettled([
        recruiterApi.getCandidate(candidate.publicId || candidate.id),
        recruiterApi.getCreditBalance(),
      ])
      const refreshed = profileResult.status === 'fulfilled' ? unwrapResponse(profileResult.value) : null
      const refreshedCandidate = extractCandidate(refreshed)
      const refreshedBalance = creditsResult.status === 'fulfilled' ? getAvailableCredits(creditsResult.value) : null

      if (refreshedCandidate && isProfileUnlocked(refreshed, refreshedCandidate)) {
        const unlockedCandidate = { ...refreshedCandidate, unlocked: true }
        const unlockedProfile = normalizeCandidateProfile(refreshed, unlockedCandidate, location.state?.candidate || {})
        const unlockedSectionsMissing = !unlockedProfile.summary && !unlockedProfile.workExperience.length && !unlockedProfile.skills.length && !unlockedProfile.career.length
        setData((current) => ({
          ...refreshed,
          candidate: { ...current.candidate, ...unlockedCandidate },
          profile: unlockedProfile,
          access: { ...(refreshed.access ?? refreshed.accessDetails ?? refreshed.access_details ?? {}), unlocked: true },
          creditBalance: creditsResult.status === 'fulfilled' ? refreshedBalance : null,
        }))
        setNotice(unlockedSectionsMissing ? 'The profile was unlocked, but the refreshed detail response did not include professional profile details.' : '')
      } else {
        setData((current) => ({ ...current, creditBalance: creditsResult.status === 'fulfilled' ? refreshedBalance : current.creditBalance }))
        setNotice(refreshedCandidate
          ? 'The unlock request succeeded, but the refreshed detail response did not confirm unlocked: true. Contact details and resumes remain hidden.'
          : 'The unlock request succeeded, but the refreshed detail response could not be loaded. Contact details and resumes remain hidden; use Reload to try again.')
      }
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
  const downloadResume = async (resume) => {
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
    <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div className="flex min-w-0 items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-white">{candidate.initials || 'MH'}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{unlocked ? (contact.fullName || candidate.name || candidate.title) : (candidate.title || 'Candidate Profile')}</h1>{candidate.credentialsVerified && <Badge tone="teal" className="normal-case tracking-normal">Verified Credentials</Badge>}{candidate.availability && <Badge tone="success" className="normal-case tracking-normal">Available - {candidate.availability}</Badge>}{unlocked && <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}{contacted && <Badge tone="teal" className="normal-case tracking-normal">Contacted</Badge>}</div><p className="mt-1 text-sm text-slate-600">{[candidate.title, candidate.specialty, candidate.location, candidate.experience].filter(Boolean).join(' | ')}</p></div></div><div className="flex flex-wrap items-center gap-3 xl:justify-end"><button type="button" onClick={() => navigate('/recruiter/find-candidates')} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><ArrowLeft className="h-3.5 w-3.5" />Back to Search</button>{unlocked && contact.email && <a href={`mailto:${contact.email}`} onClick={() => { markCandidateContacted(candidate.candidateId || candidate.candidate_id || candidate.id || candidateId); setContacted(true) }} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" />{contacted ? 'Email Candidate Again' : 'Contact Candidate'}</a>}{!unlocked && <button type="button" onClick={() => setUnlockModalOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"><UnlockKeyhole className="h-4 w-4" />Unlock Full Profile</button>}</div></div></section>
    <ProfileSection title="Job Application Status">
      {applicationsLoading ? <p className="text-sm text-slate-500">Loading this candidate’s applications…</p>
        : applicationsError ? <p className="text-sm text-amber-800">Application statuses could not be loaded. Please reload the profile to try again.</p>
          : jobApplications.length ? <div className="flex flex-col divide-y divide-slate-100">{jobApplications.map((application, index) => <div key={application.id || `${application.jobId}-${index}`} className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div><Link to={`/recruiter/jobs/${encodeURIComponent(application.jobId)}/applications`} className="text-sm font-semibold text-blue-700 hover:underline">{application.jobTitle}</Link>{application.appliedAt && <p className="mt-1 text-xs text-slate-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>}</div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${applicationStatusTone(application.status)}`}>{applicationStatusLabel(application.status)}</span></div>)}</div>
            : <p className="text-sm text-slate-500">No job application status is available for this candidate.</p>}
    </ProfileSection>
    {actionError && <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{actionError}</p>}
    {unlocked && !hasContactDetails && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The profile is unlocked, but this detail response did not include contact information. Reload the profile or check the candidate detail API response.</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]"><div className="flex min-w-0 flex-col gap-5"><ProfileSection title="Professional Summary">{profile.summary ? <p className="text-sm leading-5 text-slate-700">{profile.summary}</p> : <p className="text-sm text-slate-500">No professional summary is available.</p>}</ProfileSection>
      {unlocked && Array.isArray(profile.resumes) && profile.resumes.length > 0 && <ProfileSection title="Resume & Documents"><div className="flex flex-col gap-3">{profile.resumes.map((resume, index) => <div key={resume.resumeId || resume.id || `${resume.fileName || resume.name || 'resume'}-${index}`} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FileText className="h-6 w-6 text-slate-600" /><div><p className="text-sm font-semibold text-slate-900">{resume.fileName || resume.name || 'Resume'}</p><p className="text-xs text-slate-500">{resume.meta || resume.fileType || ''}</p></div></div><button type="button" disabled={resumeBusy || !(resume.resumeId || resume.id)} onClick={() => downloadResume(resume)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Download className="h-3.5 w-3.5" />{resumeBusy ? 'Downloading...' : 'Download Resume'}</button></div>)}</div></ProfileSection>}
      <ProfileSection title="Work Experience">{experience.length > 0 ? <div className="flex flex-col gap-4">{experience.map((item, index) => <React.Fragment key={item.id || `${item.title}-${index}`}><div className="flex flex-col gap-1.5"><div className="flex flex-col justify-between gap-1 sm:flex-row"><h3 className="text-sm font-bold text-slate-900">{item.title || item.role || 'Role unavailable'}</h3><span className="text-xs text-slate-500">{item.dates || item.period}</span></div><p className="text-xs font-medium text-slate-600">{item.company}{item.employmentType ? ` · ${item.employmentType}` : ''}{item.location ? ` | ${item.location}` : ''}</p>{item.description && <p className="text-xs leading-5 text-slate-600">{item.description}</p>}</div>{index < experience.length - 1 && <div className="border-t border-slate-100" />}</React.Fragment>)}</div> : <p className="text-sm text-slate-500">No work experience is available.</p>}</ProfileSection>
      <ProfileSection title="Skills">{skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{skill}</span>)}</div> : <p className="text-sm text-slate-500">No skills are available.</p>}</ProfileSection></div>
      <div className="flex flex-col gap-5"><section className={`rounded-xl border border-slate-200 p-5 ${unlocked ? 'bg-green-50' : 'bg-slate-50'}`}><h2 className="text-xl font-semibold text-slate-900">Contact Information</h2>{!unlocked && <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4" />Email, phone, and address are masked until profile unlock</div>}<div className={`mt-4 flex flex-col gap-2.5 ${unlocked ? '' : 'opacity-75'}`}><ContactRow label="Full Name" value={unlocked ? (contact.fullName || '-') : (contact.maskedFullName || maskedCandidateName(candidate))} icon={Eye} /><ContactRow label="Email" value={unlocked ? (contact.email || '-') : (contact.maskedEmail || maskContactValue('', 'email'))} icon={Mail} /><ContactRow label="Phone" value={unlocked ? (contact.phone || '-') : (contact.maskedPhone || maskContactValue('', 'phone'))} icon={Phone} /><ContactRow label="Address" value={unlocked ? (contact.address || '-') : (contact.maskedAddress || maskContactValue('', 'address'))} icon={MapPin} /></div></section><ProfileSection title="Career Preferences">{career.length ? <dl className="flex flex-col gap-3">{career.map((item) => <div key={item.label} className="flex items-start justify-between gap-4 text-xs"><dt className="text-slate-500">{item.label}</dt><dd className="text-right font-semibold text-slate-800">{item.value}</dd></div>)}</dl> : <p className="text-sm text-slate-500">No preferences are available.</p>}</ProfileSection></div></div>
    {unlockModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5"><section role="dialog" aria-modal="true" aria-labelledby="unlock-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="unlock-title" className="text-xl font-bold text-slate-900">Unlock candidate profile?</h2><p className="mt-3 text-sm text-slate-600">Unlock cost: {unlockCostKnown ? unlockCost : 'Unavailable'} credits. Available balance: {creditBalanceKnown ? availableCredits : 'Unavailable'} credits.</p>{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}{!canUnlock && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{creditBalanceKnown && unlockCostKnown ? 'Your credit balance is too low to unlock this profile.' : 'The credit balance or unlock cost could not be loaded.'} <Link to="/recruiter/plans-credits" onClick={() => setUnlockModalOpen(false)} className="ml-1 font-semibold underline">View Plans & Credits</Link></div>}<div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy || !canUnlock} onClick={unlock} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Unlocking...' : canUnlock ? 'Confirm Unlock' : 'Insufficient Credits'}</button><button type="button" disabled={busy} onClick={() => setUnlockModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button></div></section></div>}
  </div>
}

function maskContactValue(value, kind) {
  const raw = String(value || '').trim()
  if (!raw) {
    if (kind === 'email') return '••••••@••••.•••'
    if (kind === 'phone') return '+• (•••) •••-••••'
    if (kind === 'address') return '••••••••••, ••••••'
    return '••••••••••'
  }
  if (/[*•●]/.test(raw)) return raw
  if (kind === 'email') {
    const [local = '', domain = ''] = raw.split('@')
    return domain ? `${local.slice(0, 1)}••••••@${domain}` : '••••••@••••.•••'
  }
  if (kind === 'phone') {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return '+• (•••) •••-••••'
    const visibleTail = digits.slice(-2)
    return `${raw.replace(/\d/g, '•').slice(0, Math.max(0, raw.replace(/\d/g, '•').length - 2))}${visibleTail}`
  }
  if (kind === 'address') {
    const parts = raw.split(',')
    const location = parts.length > 1 ? `, ${parts.slice(1).join(',').trim()}` : ''
    return `••••••••${location}`
  }
  return raw.split(/\s+/).map((part) => part.length > 1 ? `${part[0]}${'•'.repeat(Math.min(part.length - 1, 8))}` : '•').join(' ')
}

function maskedCandidateName(candidate = {}) {
  const id = String(candidate.candidateId || candidate.candidate_id || candidate.publicId || candidate.public_id || candidate.id || '').replace(/[^a-z\d]/gi, '')
  return id ? `Candidate ${id.slice(0, 8).toUpperCase()}` : 'Candidate'
}

function isProfileUnlocked(response = {}, candidate = {}) {
  return response.unlocked === true || candidate.unlocked === true ||
    response.access?.unlocked === true || response.accessDetails?.unlocked === true || response.access_details?.unlocked === true
}

function ProfileSection({ title, children }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold text-slate-900">{title}</h2><div className="mt-3.5">{children}</div></section> }
function ContactRow({ label, value, icon: Icon }) { return <div className="flex items-start justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</span><span className="text-right font-semibold text-slate-800">{value || '-'}</span></div> }
function formatProfileExperience(value) {
  if (value == null || value === '') return ''
  const numeric = typeof value === 'number' ? value : /^\d+(?:\.\d+)?$/.test(String(value).trim()) ? Number(value) : null
  if (numeric !== null) return numeric <= 0 ? '' : `${numeric} ${numeric === 1 ? 'year' : 'years'} experience`
  return String(value)
}
