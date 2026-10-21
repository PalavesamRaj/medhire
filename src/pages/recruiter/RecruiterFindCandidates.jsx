import React, { useEffect, useState } from 'react'
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, Eye, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { RecruiterApiError, RecruiterEmpty, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'
import { recruiterApi } from '../../lib/recruiterApi'

const initialFilters = { specialty: '', location: '', experience: '', licenseState: '', employmentPreference: '', availability: '' }
const filters = [
  ['specialty', 'Specialty'],
  ['location', 'Location'],
  ['experience', 'Experience', ['1+ years', '4+ years', '8+ years']],
  ['licenseState', 'License State'],
  ['employmentPreference', 'Employment Preference'],
  ['availability', 'Availability'],
]

function getCandidateList(payload) {
  let current = payload
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (Array.isArray(current)) {
      return { items: current.map(normalizeCandidate), pagination: { page: 1, pageSize: 20, total: current.length, totalPages: 1 } }
    }
    const list = current.items ?? current.results ?? current.candidates ?? current.records
    if (Array.isArray(list)) {
      const pagination = current.pagination ?? payload?.pagination ?? payload?.data?.pagination ?? {}
      return {
        items: list.map(normalizeCandidate),
        pagination: {
          page: Number(pagination.page ?? pagination.currentPage) || 1,
          pageSize: Number(pagination.pageSize ?? pagination.limit) || 20,
          total: Number(pagination.total ?? pagination.totalCount ?? pagination.count) || list.length,
          totalPages: Number(pagination.totalPages ?? pagination.pages) || 1,
        },
      }
    }
    if (Array.isArray(current)) {
      return { items: current.map(normalizeCandidate), pagination: { page: 1, pageSize: 20, total: current.length, totalPages: 1 } }
    }
    current = current.data ?? current.items ?? current
    if (current === payload) break
  }
  if (Array.isArray(payload)) return { items: payload.map(normalizeCandidate), pagination: { page: 1, pageSize: 20, total: payload.length, totalPages: 1 } }
  throw new Error('The /recruiter/candidates response did not contain an items, results, or candidates list.')
}

function normalizeCandidate(record) {
  const nested = {
    ...(record?.profile && typeof record.profile === 'object' ? record.profile : {}),
    ...(record?.profile?.professional && typeof record.profile.professional === 'object' ? record.profile.professional : {}),
    ...(record?.profile?.professionalInformation && typeof record.profile.professionalInformation === 'object' ? record.profile.professionalInformation : {}),
    ...(record?.profile?.professional_information && typeof record.profile.professional_information === 'object' ? record.profile.professional_information : {}),
    ...(record?.profile?.personal && typeof record.profile.personal === 'object' ? record.profile.personal : {}),
    ...(record?.professional && typeof record.professional === 'object' ? record.professional : {}),
    ...(record?.professionalInformation && typeof record.professionalInformation === 'object' ? record.professionalInformation : {}),
    ...(record?.professional_information && typeof record.professional_information === 'object' ? record.professional_information : {}),
    ...(record?.candidateDetails && typeof record.candidateDetails === 'object' ? record.candidateDetails : {}),
    ...(record?.candidate_details && typeof record.candidate_details === 'object' ? record.candidate_details : {}),
    ...(record?.candidate_profile && typeof record.candidate_profile === 'object' ? record.candidate_profile : {}),
    ...(record?.candidateProfile && typeof record.candidateProfile === 'object' ? record.candidateProfile : {}),
    ...(record?.candidate && typeof record.candidate === 'object' ? record.candidate : {}),
  }
  const profile = { ...(record || {}), ...(nested || {}) }
  const id = profile.candidateId ?? profile.candidate_id ?? profile.publicId ?? profile.public_id ?? profile.id ?? profile.userId ?? profile.user_id ?? profile._id
  const title = profile.currentJobTitle ?? profile.current_job_title ?? profile.title ?? profile.jobTitle ?? profile.job_title ?? profile.roleTitle ?? profile.role_title ?? profile.professionalTitle ?? profile.professional_title ?? profile.profession ?? profile.professionName ?? profile.profession_name ?? profile.headline ?? profile.position ?? profile.positionTitle ?? profile.position_title ?? profile.currentRole ?? profile.current_role ?? profile.currentPosition ?? profile.current_position ?? profile.designation
  const specialty = profile.specialty ?? profile.primarySpecialty ?? profile.primary_specialty ?? profile.specialties ?? profile.specialtyName ?? profile.specialty_name ?? profile.specialization
  const experienceValue = profile.yearsOfExperience ?? profile.years_of_experience ?? profile.experienceYears ?? profile.experience_years ?? profile.totalExperienceYears ?? profile.total_experience_years ?? profile.experience
  const experience = typeof experienceValue === 'object' && experienceValue
    ? experienceValue.years ?? experienceValue.yearCount ?? experienceValue.year_count ?? experienceValue.totalYears ?? experienceValue.total_years ?? experienceValue.value
    : experienceValue
  const locationValue = profile.location ?? profile.currentLocation ?? profile.current_location ?? profile.preferredLocation ?? profile.preferred_location ?? [profile.city ?? profile.cityName ?? profile.city_name, profile.state ?? profile.stateName ?? profile.state_name ?? profile.stateCode ?? profile.state_code].filter(Boolean).join(', ')
  const location = typeof locationValue === 'object' && locationValue
    ? [locationValue.city ?? locationValue.cityName ?? locationValue.city_name, locationValue.state ?? locationValue.stateName ?? locationValue.state_name ?? locationValue.stateCode ?? locationValue.state_code, locationValue.country ?? locationValue.countryName ?? locationValue.country_name].filter(Boolean).join(', ')
    : locationValue
  const access = profile.access ?? profile.accessDetails ?? profile.access_details ?? {}
  const unlockedValue = profile.unlocked ?? profile.isUnlocked ?? profile.is_unlocked ?? profile.unlockedStatus ?? profile.unlocked_status ?? access.unlocked ?? access.isUnlocked ?? access.is_unlocked
  const unlocked = unlockedValue === true || String(unlockedValue).toLowerCase() === 'true' || String(unlockedValue).toLowerCase() === 'unlocked'
  const openToWork = profile.openToWork ?? profile.open_to_work ?? profile.availableToWork ?? profile.available_to_work
  const displayValue = (value) => {
    if (value == null || value === '') return ''
    if (typeof value !== 'object') return String(value)
    return value.label ?? value.name ?? value.title ?? value.degree ?? value.qualification ?? value.value ?? ''
  }
  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []).map(displayValue).filter(Boolean)
  const licenseValue = profile.license ?? profile.licenses ?? profile.licenseSummary ?? profile.license_summary ?? profile.licenseDetails ?? profile.license_details
  const licenseItems = Array.isArray(licenseValue) ? licenseValue : licenseValue && typeof licenseValue === 'object' ? [licenseValue] : []
  const license = Array.isArray(licenseValue) ? licenseValue.map((item) => {
    if (!item || typeof item !== 'object') return displayValue(item)
    const state = item.state ?? item.stateCode ?? item.state_code ?? item.licenseState ?? item.license_state
    const status = item.status ?? item.licenseStatus ?? item.license_status ?? item.name ?? item.type
    return [displayValue(status), displayValue(state)].filter(Boolean).join(' — ')
  }).filter(Boolean).join(', ') : licenseValue && typeof licenseValue === 'object'
    ? [displayValue(licenseValue.status ?? licenseValue.licenseStatus ?? licenseValue.license_status ?? licenseValue.name ?? licenseValue.type), displayValue(licenseValue.state ?? licenseValue.stateCode ?? licenseValue.state_code ?? licenseValue.licenseState ?? licenseValue.license_state)].filter(Boolean).join(' — ')
    : displayValue(licenseValue)
  const credentialRaw = profile.credentialStatus ?? profile.credential_status ?? profile.credentialVerificationStatus ?? profile.credential_verification_status ?? profile.verificationStatus ?? profile.verification_status ?? profile.verifiedCredentials ?? profile.verified_credentials
  const credentialStatus = credentialRaw === true ? 'Verified Credentials' : displayValue(credentialRaw)
  const credentialsVerified = profile.credentialsVerified === true || profile.credentials_verified === true || profile.isVerified === true || profile.is_verified === true || profile.verified === true || credentialRaw === true || /^(verified|approved|valid|verified credentials)$/i.test(credentialStatus.trim())
  const licenseState = licenseItems.map((item) => displayValue(item?.state ?? item?.stateCode ?? item?.state_code ?? item?.licenseState ?? item?.license_state)).filter(Boolean).join(', ')
  const availabilityValue = profile.availability ?? profile.availabilityStatus ?? profile.availability_status ?? (openToWork === true || String(openToWork).toLowerCase() === 'true' ? 'Open to work' : '')
  const availability = displayValue(availabilityValue)
  const employmentValue = profile.employmentPreference ?? profile.employment_preference ?? profile.employmentType ?? profile.employment_type ?? profile.preferences?.employmentTypes ?? profile.preferences?.employment_types
  const employmentPreference = Array.isArray(employmentValue) ? employmentValue.map(displayValue).filter(Boolean).join(', ') : displayValue(employmentValue)
  const experienceYears = Number.parseFloat(String(experience ?? '').match(/\d+(?:\.\d+)?/)?.[0] || '')
  return {
    ...profile,
    id: id == null ? '' : String(id),
    publicId: profile.candidateId ?? profile.candidate_id ?? profile.publicId ?? profile.public_id ?? id,
    initials: profile.initials ?? profile.avatarInitials ?? profile.avatar_initials ?? '',
    title: title ?? '',
    displayName: profile.fullName ?? profile.full_name ?? profile.candidateName ?? profile.candidate_name ?? profile.name ?? '',
    unlocked,
    specialty: list(specialty).join(', '),
    experience: formatExperience(experience),
    location: location ?? '',
    education: displayValue(profile.education ?? profile.educationLevel ?? profile.education_level ?? profile.degree ?? profile.highestDegree ?? profile.highest_degree),
    license,
    availability: availability || (openToWork === false || String(openToWork).toLowerCase() === 'false' ? 'Not currently available' : ''),
    openToWork: openToWork === true || String(openToWork).toLowerCase() === 'true',
    licenseState,
    employmentPreference,
    experienceYears: Number.isFinite(experienceYears) ? experienceYears : 0,
    credentialStatus: credentialStatus || displayValue(profile.resumeStatus ?? profile.resume_status),
    credentialsVerified,
    tags: list(profile.tags ?? profile.skills),
  }
}

function formatExperience(value) {
  if (value == null || value === '') return ''
  const numeric = typeof value === 'number' ? value : /^\d+(?:\.\d+)?$/.test(String(value).trim()) ? Number(value) : null
  if (numeric !== null) return numeric <= 0 ? '' : `${numeric} ${numeric === 1 ? 'year' : 'years'} experience`
  return String(value)
}

function initialsFor(candidate) {
  if (candidate.initials) return candidate.initials
  return 'MH'
}

function displayCandidateId(candidate) {
  const value = String(candidate.publicId || candidate.id || '')
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ? '' : value
}

function candidateDetails(candidate) {
  return [
    { value: displayCandidateId(candidate) },
    { value: candidate.experience },
    { value: candidate.location },
    { value: candidate.education ? `Edu: ${candidate.education}` : '' },
    { value: candidate.license ? `License: ${candidate.license}` : '', className: 'font-semibold text-teal-700' },
    { value: candidate.employmentPreference ? `Pref: ${candidate.employmentPreference}` : '' },
    { value: candidate.availability ? `Avail: ${candidate.availability}` : '', className: 'font-semibold text-blue-700' },
  ].filter((item) => item.value)
}

// React Strict Mode replays mount effects in development. Share the in-flight
// directory request so that replay does not send the same GET twice.
let candidateDirectoryRequest

function getCandidateDirectory() {
  if (!candidateDirectoryRequest) {
    candidateDirectoryRequest = recruiterApi.searchCandidates().finally(() => {
      candidateDirectoryRequest = null
    })
  }
  return candidateDirectoryRequest
}

export default function RecruiterFindCandidates() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('search') || '')
  const [selectedFilters, setSelectedFilters] = useState(initialFilters)
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [shortlisted, setShortlisted] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    // The documented GET has no confirmed query parameters; load with no query string and filter locally.
    getCandidateDirectory().then((payload) => {
      if (!active) return
      const response = getCandidateList(payload); setResults(response.items)
    }).catch((requestError) => { if (active) setError(requestError) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  const updateFilter = (key, value) => { setSelectedFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const clearFilters = () => { setQuery(''); setSubmittedQuery(''); setSelectedFilters(initialFilters); setPage(1) }
  const saveCandidate = async (candidate) => {
    const publicId = candidate.publicId || candidate.id
    setSavingId(publicId); setActionMessage('')
    try {
      if (shortlisted.includes(publicId)) return
      await recruiterApi.addShortlistedCandidate(publicId)
      setShortlisted((current) => [...current, publicId]); setActionMessage('Candidate added to your shortlist.')
    } catch (requestError) { setActionMessage(requestError.message) } finally { setSavingId(null) }
  }
  const filteredResults = results.filter((candidate) => {
    const searchable = [candidate.title, candidate.displayName, candidate.specialty, candidate.location, candidate.education, candidate.license, candidate.licenseState, candidate.employmentPreference, candidate.availability, ...candidate.tags].filter(Boolean).join(' ').toLowerCase()
    const experienceMin = selectedFilters.experience === '8+ years' ? 8 : selectedFilters.experience === '4+ years' ? 4 : selectedFilters.experience === '1+ years' ? 1 : 0
    return (!submittedQuery || searchable.includes(submittedQuery.toLowerCase())) &&
      (!selectedFilters.specialty || candidate.specialty.toLowerCase().includes(selectedFilters.specialty.trim().toLowerCase())) &&
      (!selectedFilters.location || candidate.location.toLowerCase().includes(selectedFilters.location.trim().toLowerCase())) &&
      (!experienceMin || candidate.experienceYears >= experienceMin) &&
      (!selectedFilters.licenseState || candidate.licenseState.toLowerCase().includes(selectedFilters.licenseState.trim().toLowerCase())) &&
      (!selectedFilters.employmentPreference || candidate.employmentPreference.toLowerCase().includes(selectedFilters.employmentPreference.trim().toLowerCase())) &&
      (!selectedFilters.availability || candidate.availability.toLowerCase().includes(selectedFilters.availability.trim().toLowerCase()))
  })
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize))
  const pageResults = filteredResults.slice((page - 1) * pageSize, page * pageSize)
  const hasFilters = Boolean(submittedQuery || Object.values(selectedFilters).some(Boolean))

  return <div className="flex flex-col gap-5">
    <section><p className="text-xs font-bold tracking-wide text-teal-600">CANDIDATE SEARCH</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Find Healthcare Professionals</h1><p className="mt-1 text-sm text-slate-500">Search verified healthcare talent by specialty, experience and location.</p></section>
    <form onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); setPage(1) }} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <label className="relative block flex-1"><span className="sr-only">Search by role, skill, or specialty</span><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by role, skill, specialty... e.g. Registered Nurse" className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"><Search className="h-4 w-4" />Search Candidates</button>
    </form>
    <div className="flex flex-wrap items-center gap-2"><div className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" />Filters</div>{filters.map(([key, label, options]) => options ? <label key={key} className={`relative inline-flex h-9 items-center rounded-full border px-3 py-1.5 text-xs font-bold ${selectedFilters[key] ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}><span className="sr-only">{label}</span><select value={selectedFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="appearance-none bg-transparent pr-4 outline-none"><option className="bg-white text-slate-900" value="">{label}</option>{options.map((option) => <option className="bg-white text-slate-900" key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 h-3 w-3" /></label> : <input key={key} aria-label={label} value={selectedFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} placeholder={label} className={`h-9 w-36 rounded-full border px-3 text-xs font-semibold outline-none focus:border-blue-500 ${selectedFilters[key] ? 'border-blue-600 bg-blue-600 text-white placeholder:text-blue-100' : 'border-slate-200 bg-white text-slate-600'}`} />)}{hasFilters && <button type="button" onClick={clearFilters} className="ml-auto text-xs font-semibold text-blue-600">Clear Filters</button>}</div>
    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold text-slate-900">Healthcare Professionals</h2><span className="text-xs text-slate-500">{filteredResults.length} candidates found</span></div>
    {error && <RecruiterApiError error={error} onRetry={() => setReload((n) => n + 1)} />}
    {actionMessage && <p role="status" className="text-sm text-slate-600">{actionMessage}</p>}
    {loading ? <RecruiterLoading label="Searching candidates…" /> : <div className="flex flex-col gap-2.5">
      {pageResults.map((candidate) => <article key={candidate.publicId || candidate.id} className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-3.5 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">{initialsFor(candidate)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h3 className="text-sm font-bold text-slate-900">{candidate.unlocked && candidate.displayName ? candidate.displayName : candidate.title || (candidate.specialty ? `${candidate.specialty} professional` : 'Healthcare professional')}</h3>{candidate.specialty && <Badge tone="teal" className="normal-case tracking-normal">{candidate.specialty}</Badge>}{candidate.credentialsVerified && <Badge tone="teal" className="normal-case tracking-normal">Verified Credentials</Badge>}{candidate.credentialStatus && !candidate.credentialsVerified && <Badge tone="slate" className="normal-case tracking-normal">{String(candidate.credentialStatus).replaceAll('_', ' ')}</Badge>}{candidate.unlocked && <Badge tone="success" className="normal-case tracking-normal">Unlocked</Badge>}</div><div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4 text-slate-500">{candidateDetails(candidate).map((item, index) => <React.Fragment key={`${item.value}-${index}`}>{index > 0 && <span className="text-slate-300" aria-hidden="true">•</span>}<span className={item.className || ''}>{item.value}</span></React.Fragment>)}</div>{candidate.tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{candidate.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{tag}</span>)}</div>}</div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{candidate.publicId && <Link to={`/recruiter/candidates/${encodeURIComponent(candidate.publicId)}`} state={{ candidate }} className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold transition sm:flex-none ${candidate.unlocked ? 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Eye className="h-3.5 w-3.5" />{candidate.unlocked ? 'View Full Profile' : 'View Profile'}</Link>}<button type="button" disabled={!candidate.publicId || savingId === candidate.publicId || shortlisted.includes(candidate.publicId)} onClick={() => saveCandidate(candidate)} aria-label={`Add ${candidate.title || 'candidate'} to shortlist`} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"><Bookmark className="h-4 w-4" fill={shortlisted.includes(candidate.publicId) ? 'currentColor' : 'none'} /></button></div>
      </article>)}
      {!pageResults.length && !error && <RecruiterEmpty>No candidates match the selected search and filters.</RecruiterEmpty>}
    </div>}
    <div className="flex items-center justify-between pt-2 text-xs text-slate-500"><span>Showing {pageResults.length ? `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + pageResults.length}` : '0'} of {filteredResults.length}</span><nav aria-label="Candidate results pages" className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="flex items-center gap-1 rounded border px-2 py-2 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />Prev</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="flex items-center gap-1 rounded border px-2 py-2 disabled:opacity-40">Next<ChevronRight className="h-3.5 w-3.5" /></button></nav></div>
  </div>
}
