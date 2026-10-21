import React, { useEffect, useState } from 'react'
import { Download, Eye, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading, getListResponse } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'
import { isCandidateContacted } from '../../lib/recruiterCandidateContact'

function normalizePurchasedCandidate(item = {}) {
  const candidate = item.candidate || item.profile || item.candidateProfile || item.candidate_profile || item
  const publicId = item.publicId || item.public_id || item.candidatePublicId || item.candidate_public_id || candidate.publicId || candidate.public_id
  const candidateId = item.candidateId || item.candidate_id || candidate.candidateId || candidate.candidate_id
  const id = publicId || candidateId || item.id || candidate.id
  const city = candidate.city || candidate.cityName || item.city || item.city_name
  const state = candidate.state || item.state
  const location = candidate.location || candidate.locationName || item.location || item.location_name || [city, state].filter(Boolean).join(', ')
  const experienceValue = candidate.experience ?? item.experience ?? candidate.yearsOfExperience ?? candidate.years_of_experience ?? item.yearsOfExperience ?? item.years_of_experience
  const experience = typeof experienceValue === 'number' ? `${experienceValue} years` : experienceValue
  const name = candidate.name || candidate.fullName || candidate.full_name || candidate.displayName || candidate.display_name || item.candidateName || item.candidate_name || item.fullName || item.full_name || item.name
  const rawStatus = item.contactStatus || item.contact_status || candidate.contactStatus || candidate.contact_status || item.status || candidate.status
  const normalizedStatus = rawStatus ? String(rawStatus).toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Active'
  const status = isCandidateContacted(candidateId || publicId || id) || normalizedStatus === 'Contacted'
    ? 'Contacted'
    : ['Unlocked', 'Active'].includes(normalizedStatus) ? 'Active' : normalizedStatus

  return {
    ...item,
    ...candidate,
    id,
    publicId,
    candidateId,
    candidateUuid: item.candidateUuid || item.candidate_uuid || candidate.candidateUuid || candidate.candidate_uuid || candidateId,
    name,
    initials: candidate.initials || item.initials || (name ? name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : undefined),
    title: candidate.title || candidate.currentJobTitle || candidate.current_job_title || candidate.jobTitle || candidate.job_title || item.title || item.currentJobTitle || item.current_job_title || item.jobTitle || item.job_title,
    specialty: candidate.specialty || candidate.primarySpecialty || item.specialty,
    experience,
    location,
    unlockedDate: item.unlockedDate || item.unlocked_date || item.unlockedAt || item.unlocked_at || item.purchasedAt || item.purchased_at || item.createdAt || item.created_at || candidate.unlockedDate || candidate.unlocked_at,
    status,
    resumeId: item.resumeId || item.resume_id || candidate.resumeId || candidate.resume_id || candidate.resume?.resumeId || candidate.resume?.resume_id || candidate.resume?.id,
    resumeFileName: item.resumeFileName || item.resume_file_name || candidate.resumeFileName || candidate.resume_file_name || candidate.resume?.fileName || candidate.resume?.file_name || candidate.resume?.name,
  }
}

const APPLICATION_STATUS_LABELS = { APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', HIRED: 'Hired', REJECTED: 'Rejected' }
const applicationStatusKey = (value) => String(value || '').toUpperCase().replaceAll(' ', '_')
const applicationStatusLabel = (value) => APPLICATION_STATUS_LABELS[applicationStatusKey(value)] || value || 'Unknown'

function relatedCandidateIds(item = {}) {
  const candidate = item.candidate || item.applicant || item.candidateProfile || item.candidate_profile || {}
  return [item.candidateId, item.candidate_id, item.candidateUuid, item.candidate_uuid, item.candidatePublicId, item.candidate_public_id, item.publicId, item.public_id,
    candidate.candidateId, candidate.candidate_id, candidate.id, candidate.publicId, candidate.public_id]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value).toLowerCase())
}

function getResumeFromCandidateResponse(response) {
  const root = response?.data ?? response ?? {}
  const candidate = root.candidate || root.candidateDetails || root.candidate_details || root.candidateProfile || root.candidate_profile || root
  const profile = candidate.profile || candidate.professionalProfile || candidate.professional_profile || root.profile || {}
  const rawResumes = profile.resumes || profile.resumeLinks || profile.resume_links || profile.resumeFiles || profile.resume_files || profile.resume || profile.cv || profile.resumeDetails || profile.resume_details || candidate.resumes || candidate.resumeLinks || candidate.resume_links || candidate.resumeFiles || candidate.resume_files || candidate.resume || root.resumes || root.resume
  const resumes = Array.isArray(rawResumes) ? rawResumes : rawResumes ? [rawResumes] : []
  const resumeWithId = resumes.find((resume) => resume && typeof resume === 'object' && (resume.resumeId || resume.resume_id || resume.id))
  return resumeWithId || resumes[0] || (() => {
    const resumeId = profile.resumeId || profile.resume_id || candidate.resumeId || candidate.resume_id || root.resumeId || root.resume_id
    return resumeId ? { resumeId, fileName: profile.resumeFileName || profile.resume_file_name || candidate.resumeFileName || candidate.resume_file_name || root.resumeFileName || root.resume_file_name } : null
  })()
}

export default function RecruiterPurchasedCandidates() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    const loadPurchasedCandidates = async () => {
      try {
        const [purchasedResult, jobsResult] = await Promise.allSettled([recruiterApi.getPurchasedCandidates(), recruiterApi.getJobs()])
        if (purchasedResult.status === 'rejected') throw purchasedResult.reason
        const purchased = getListResponse(purchasedResult.value).items.map(normalizePurchasedCandidate)
        const applicationIndex = new Map()
        let applicationLoadError = jobsResult.status === 'rejected' ? jobsResult.reason : null
        if (jobsResult.status === 'fulfilled') {
          const jobs = getListResponse(jobsResult.value).items
          const applicationResults = await Promise.allSettled(jobs.map(async (job) => {
            const jobId = job.id || job.jobId || job.job_id
            if (!jobId) return { applications: [], jobId: '', jobTitle: '' }
            const applications = getListResponse(await recruiterApi.getJobApplications(jobId)).items
            return { applications, jobId, jobTitle: job.title || job.jobTitle || job.job_title || 'Job posting' }
          }))
          applicationResults.forEach((result) => {
            if (result.status === 'rejected') { applicationLoadError ||= result.reason; return }
            result.value.applications.forEach((application) => {
              const related = {
                applicationId: application.applicationId || application.application_id || application.id,
                status: application.status || application.applicationStatus || application.application_status || 'APPLIED',
                jobId: result.value.jobId,
                jobTitle: result.value.jobTitle,
              }
              relatedCandidateIds(application).forEach((candidateId) => {
                const entries = applicationIndex.get(candidateId) || []
                entries.push(related)
                applicationIndex.set(candidateId, entries)
              })
            })
          })
        }
        const enriched = purchased.map((candidate) => {
          const ids = [candidate.candidateId, candidate.candidateUuid, candidate.publicId, candidate.id]
            .filter((value) => value !== undefined && value !== null && value !== '')
            .map((value) => String(value).toLowerCase())
          const applications = [...new Map(ids.flatMap((id) => applicationIndex.get(id) || []).map((application) => [application.applicationId || `${application.jobId}-${application.status}`, application])).values()]
          return { ...candidate, jobApplications: applications }
        })
        if (!active) return
        setItems(enriched)
        if (applicationLoadError) setError(applicationLoadError)
      } catch (requestError) {
        if (active) setError(requestError)
      } finally { if (active) setLoading(false) }
    }
    loadPurchasedCandidates()
    return () => { active = false }
  }, [reload])

  const filteredItems = items.filter((candidate) => {
    const text = [candidate.name, candidate.publicId, candidate.id, candidate.title, candidate.specialty, candidate.location, candidate.status, ...(candidate.jobApplications || []).flatMap((application) => [application.jobTitle, applicationStatusLabel(application.status)])].filter(Boolean).join(' ').toLowerCase()
    return (!query || text.includes(query.trim().toLowerCase())) &&
      (!specialty || String(candidate.specialty || '').toLowerCase().includes(specialty.trim().toLowerCase())) &&
      (!location || String(candidate.location || '').toLowerCase().includes(location.trim().toLowerCase())) &&
      (!status || String(candidate.status || '').toLowerCase() === status.toLowerCase()) &&
      (!jobStatus || (candidate.jobApplications || []).some((application) => applicationStatusKey(application.status) === jobStatus))
  })
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  const openResume = async (candidate) => {
    setError(null)
    try {
      let resume = candidate.resumeId ? { resumeId: candidate.resumeId, fileName: candidate.resumeFileName } : null
      if (!resume) {
        const profileId = candidate.publicId || candidate.candidateId || candidate.id
        if (!profileId) throw new Error('The purchased-candidate response did not include a candidate ID.')
        const response = await recruiterApi.getCandidate(profileId)
        resume = getResumeFromCandidateResponse(response)
      }
      const resumeId = resume?.resumeId || resume?.resume_id || resume?.id
      if (!resumeId) throw new Error('The candidate detail response did not include a resume ID. The backend must return a resume UUID for secure downloads.')
      const candidateUuid = candidate.candidateUuid || candidate.candidateId || candidate.id
      if (!candidateUuid) throw new Error('The purchased-candidate response did not include the candidate UUID required for secure downloads.')
      const blob = await recruiterApi.downloadCandidateResume(candidateUuid, resumeId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = resume.fileName || resume.file_name || resume.name || 'candidate-resume'
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
      setError(null)
    } catch (requestError) { setError(requestError) }
  }
  const clearFilters = () => { setQuery(''); setSpecialty(''); setLocation(''); setStatus(''); setJobStatus(''); setPage(1) }
  const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Purchased Candidates</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Purchased Candidates</h1><p className="mt-1 text-sm text-slate-500">Access candidate profiles your organization has unlocked.</p></section>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block min-w-0 flex-1"><span className="sr-only">Search purchased candidates</span><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search purchased candidates..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-500" /></label><FilterInput value={specialty} onChange={(value) => { setSpecialty(value); setPage(1) }} placeholder="Specialty" /><FilterInput value={location} onChange={(value) => { setLocation(value); setPage(1) }} placeholder="Location" /><FilterSelect value={jobStatus} onChange={(value) => { setJobStatus(value); setPage(1) }} placeholder="Job Status" options={Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))} /><FilterSelect value={status} onChange={(value) => { setStatus(value); setPage(1) }} placeholder="Contact Status" options={['Active', 'Contacted']} /></div>
    <RecruiterApiError error={error} onRetry={() => setReload((value) => value + 1)} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-700 xl:grid xl:grid-cols-[minmax(165px,1fr)_135px_100px_45px_110px_95px_minmax(155px,1fr)_90px_80px]"><span>Candidate</span><span>Professional Title</span><span>Specialty</span><span>Exp</span><span>Location</span><span>Unlocked Date</span><span>Job Status</span><span>Contact Status</span><span>Actions</span></div>
      {loading ? <RecruiterLoading label="Loading purchased candidates…" /> : pageItems.map((candidate, index) => <PurchasedCandidateRow key={candidate.id || candidate.purchaseId || index} candidate={candidate} onResume={() => openResume(candidate)} />)}
      {!loading && !error && !pageItems.length && <RecruiterEmpty>No purchased candidates match your filters.</RecruiterEmpty>}
    </section>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Showing {pageItems.length ? `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + pageItems.length}` : '0'} of {filteredItems.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Prev</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div>
    {(query || specialty || location || status || jobStatus) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-blue-600">Clear Filters</button>}
  </div>
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return <label className="relative shrink-0"><span className="sr-only">Filter by {placeholder}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-auto"><option value="">{placeholder}</option>{options.map((option) => { const optionValue = typeof option === 'string' ? option : option.value; const optionLabel = typeof option === 'string' ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option> })}</select></label>
}

function FilterInput({ value, onChange, placeholder }) {
  return <label><span className="sr-only">Filter by {placeholder}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 sm:w-32" /></label>
}

function PurchasedCandidateRow({ candidate, onResume }) {
  const date = candidate.unlockedDate ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(candidate.unlockedDate)) : '—'
  const candidateLabel = candidate.name || candidate.publicId || candidate.id || 'Candidate profile'
  const profileId = candidate.publicId || candidate.candidateId || candidate.id
  return <article className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 xl:grid-cols-[minmax(165px,1fr)_135px_100px_45px_110px_95px_minmax(155px,1fr)_90px_80px] xl:items-center"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{candidate.initials || '—'}</div><div className="text-sm font-semibold text-slate-900">{candidateLabel}</div></div><div className="text-sm text-slate-600">{candidate.title || '—'}</div><div className="text-sm text-slate-600">{candidate.specialty || '—'}</div><div className="text-sm text-slate-600">{candidate.experience || '—'}</div><div className="text-sm text-slate-600">{candidate.location || '—'}</div><div className="text-xs text-slate-500">{date}</div><div className="flex flex-col items-start gap-1">{candidate.jobApplications?.length ? candidate.jobApplications.map((application) => <Link key={application.applicationId || `${application.jobId}-${application.status}`} to={`/recruiter/jobs/${encodeURIComponent(application.jobId)}/applications`} className="max-w-full text-left"><span className="block truncate text-[11px] font-medium text-slate-600">{application.jobTitle}</span><Badge tone="teal" className="mt-0.5 normal-case tracking-normal">{applicationStatusLabel(application.status)}</Badge></Link>) : <span className="text-xs text-slate-400">No application</span>}</div><div><Badge tone={candidate.status === 'Contacted' ? 'teal' : 'success'} className="normal-case tracking-normal">{candidate.status || 'Unlocked'}</Badge></div><div className="flex items-center gap-2">{profileId ? <Link to={`/recruiter/candidates/${encodeURIComponent(profileId)}`} aria-label={`View ${candidateLabel}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600"><Eye className="h-3.5 w-3.5" /></Link> : <button type="button" disabled aria-label="Candidate ID unavailable" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-600 disabled:opacity-40"><Eye className="h-3.5 w-3.5" /></button>}<button type="button" disabled={!candidate.candidateUuid && !candidate.id} onClick={onResume} aria-label={`Download ${candidateLabel} resume`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"><Download className="h-3.5 w-3.5" /></button></div></article>
}
