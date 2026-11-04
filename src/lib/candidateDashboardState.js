import { formatINRRange } from './currency'
export const hasSetupProfile = (profile) => Boolean(Object.keys(profile.personalInformation || {}).length || Object.keys(profile.professionalInformation || {}).length || profile.education?.length)
export function normalizeJob(job = {}) {
  const rawDescription = job.description || job.jobDescription || job.job_description || job.summary || ''
  const description = typeof rawDescription === 'string' ? rawDescription : String(rawDescription?.text || rawDescription?.value || '')
  const parsedSections = parseJobDescription(description)
  const salary = formatINRRange(job.salary || job.salaryRange || job.salary_range || formatSalaryRange(job))
  const responsibilities = job.responsibilities?.length ? job.responsibilities : job.duties?.length ? job.duties : job.jobResponsibilities?.length ? job.jobResponsibilities : job.job_responsibilities?.length ? job.job_responsibilities : parsedSections.responsibilities
  const requirements = job.requirements?.length ? job.requirements : job.qualifications?.length ? job.qualifications : job.jobRequirements?.length ? job.jobRequirements : job.job_requirements?.length ? job.job_requirements : parsedSections.requirements
  return {
    ...job,
    id: job.id || job.jobId || job.job_id || job._id,
    title: job.title || job.jobTitle || job.job_title || job.positionTitle || job.position_title || '',
    hospital: (typeof job.hospital === 'string' ? job.hospital : job.hospital?.name || job.hospital?.hospitalName || job.hospital?.hospital_name) || job.hospitalName || job.hospital_name || job.organizationName || job.organization_name || job.organization?.name || job.organization?.organizationName || job.companyName || job.company_name || job.facilityName || '',
    location: (typeof job.location === 'string' ? job.location : job.location?.address || [job.location?.city, job.location?.state].filter(Boolean).join(', ')) || job.jobLocation || job.job_location || [job.city || job.cityName || job.city_name, job.state || job.stateName || job.state_name].filter(Boolean).join(', '),
    type: job.type || job.employmentType || job.employment_type || '',
    specialty: job.specialty || job.department || job.specialtyName || job.specialty_name || '',
    posted: job.posted || job.postedAt || job.posted_at || job.createdAt || job.created_at,
    description: parsedSections.description,
    responsibilities: toJobList(responsibilities),
    requirements: toJobList(requirements),
    salary,
    shift: job.shift || job.shiftType || job.shift_type || job.shiftPreference || job.shift_preference || '',
    workSetting: job.workSetting || job.work_setting || '',
  }
}

export function formatEmploymentType(value) {
  const key = String(value || '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
  const labels = { FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', TEMPORARY: 'Temporary', PER_DIEM: 'Per diem', INTERNSHIP: 'Internship' }
  return labels[key] || String(value || '').replaceAll('_', ' ').replaceAll('-', ' ')
}

function formatSalaryRange(job) {
  const minimum = job.salaryMin ?? job.salary_min
  const maximum = job.salaryMax ?? job.salary_max
  if (minimum == null && maximum == null) return ''
  if (minimum == null) return String(maximum)
  if (maximum == null) return String(minimum)
  return `${minimum} - ${maximum}`
}

function toJobList(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item.trim() : item?.description || item?.name || item?.title || item?.text || '').filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  return value.replace(/\s+-\s+(?=[A-Z0-9])/g, '\n- ').split(/\r?\n/).map((item) => item.trim().replace(/^[-\u2022*]\s*/, '')).filter(Boolean)
}

function parseJobDescription(description) {
  const sections = { description, responsibilities: '', requirements: '' }
  const marker = /\b(responsibilities|duties|requirements|qualifications)\s*:\s*/gi
  const matches = [...description.matchAll(marker)]
  if (!matches.length) return sections
  sections.description = description.slice(0, matches[0].index).trim()
  matches.forEach((match, index) => {
    const key = /^(responsibilities|duties)$/i.test(match[1]) ? 'responsibilities' : 'requirements'
    const start = match.index + match[0].length
    const end = matches[index + 1]?.index ?? description.length
    const content = description.slice(start, end).trim()
    sections[key] = [sections[key], content].filter(Boolean).join('\n')
  })
  return sections
}
const APPLICATION_STATUS = { APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', INTERVIEW_SCHEDULED: 'Interview', SCHEDULED: 'Interview', REJECTED: 'Rejected', HIRED: 'Hired' }
export function normalizeApplication(application = {}) {
  const status = String(application.status || application.applicationStatus || application.application_status || 'APPLIED').toUpperCase().replaceAll(' ', '_')
  const interview = application.interview || application.interviewDetails || application.interview_details || {}
  const interviewScheduled = ['INTERVIEW', 'INTERVIEW_SCHEDULED', 'SCHEDULED'].includes(status) || Boolean(application.interviewScheduledAt || application.interview_scheduled_at || application.scheduledInterviewAt || application.scheduled_interview_at || interview.scheduledAt || interview.scheduled_at || interview.dateTime || interview.date_time)
  return { ...application, id: application.id || application.applicationId || application.application_id, applicationId: application.applicationId || application.application_id || application.id, status: interviewScheduled ? 'Interview' : APPLICATION_STATUS[status] || application.status || 'Applied', interviewScheduled, jobId: application.jobId || application.job_id || application.job?.id || application.job?.jobId }
}
export function candidateFromProfile(profile) {
  const personal = profile.personalInformation || {}
  const professional = profile.professionalInformation || {}
  return { firstName: personal.firstName || 'Candidate', lastName: personal.lastName || '', headline: professional.currentJobTitle || '', location: [personal.city, personal.state].filter(Boolean).join(', '), summary: professional.professionalSummary || '', photo: profile.photoUrl || '', professionalInformation: professional, education: profile.education || [], workExperience: profile.workExperience || [], skills: profile.skills || [], certifications: profile.certifications || [] }
}
export function createDashboardState(profile) {
  return { edits: {}, jobs: [], applications: [], savedJobIds: [], resumes: [], activities: [], privacy: {}, metrics: {}, summary: {}, loading: true, error: '' }
}
export function dashboardReducer(state, action) {
  switch (action.type) {
    case 'load': return { ...state, ...action.data, loading: false, error: action.data.error || '' }
    case 'dashboard-update': return { ...state, metrics: { ...state.metrics, ...action.metrics }, ...(action.activities ? { activities: action.activities } : {}) }
    case 'load-error': return { ...state, loading: false, error: action.error }
    case 'edit': return { ...state, edits: { ...state.edits, ...action.data } }
    case 'privacy': return { ...state, privacy: { ...action.data } }
    case 'save-job': return { ...state, savedJobIds: state.savedJobIds.includes(action.id) ? state.savedJobIds.filter((id) => id !== action.id) : [...state.savedJobIds, action.id] }
    case 'add-resume': return { ...state, resumes: [action.resume, ...state.resumes] }
    case 'remove-resume': return { ...state, resumes: state.resumes.filter((resume) => resume.id !== action.id) }
    case 'activate-resume': return state.resumes.some((resume) => resume.id === action.id && resume.status === 'Approved') ? { ...state, resumes: state.resumes.map((resume) => ({ ...resume, active: resume.id === action.id })) } : state
    case 'apply': return { ...state, applications: [action.application, ...state.applications], activities: [action.activity, ...state.activities] }
    default: return state
  }
}
export function filterJobs(jobs, filters = {}) {
  const includes = (value, query) => String(value || '').toLowerCase().includes((query || '').trim().toLowerCase())
  return jobs.filter((job) => includes(`${job.title} ${job.hospital} ${job.specialty}`, filters.q) && includes(job.hospital, filters.hospital) && includes(job.location, filters.location) && (!filters.type || filters.type === 'All' || job.type === filters.type) && (!filters.specialty || job.specialty === filters.specialty))
}

const normalizedText = (value) => String(value || '').trim().toLowerCase()
const textList = (value) => (Array.isArray(value) ? value : value ? [value] : []).map((item) => normalizedText(typeof item === 'object' ? item.name || item.label || item.value : item)).filter(Boolean)

// Return only live jobs with an actual match to the candidate's profile or
// preferences. An empty match set is preferable to presenting unrelated jobs.
export function recommendJobs(jobs, profile, { applications = [], savedJobIds = [] } = {}) {
  const personal = profile?.personalInformation || {}
  const professional = profile?.professionalInformation || {}
  const preferences = profile?.careerPreferences || profile?.preferences || {}
  const wanted = [
    ...textList(preferences.preferredSpecialties || preferences.preferred_specialties),
    ...textList(preferences.desiredJobTitle || preferences.desired_job_title),
    ...textList(professional.currentJobTitle || professional.current_job_title || professional.headline),
    ...textList(professional.specialty || professional.specialties || profile?.specialty || profile?.specialties),
    ...textList(profile?.skills),
  ]
  const locations = [...textList(preferences.preferredLocations || preferences.preferred_locations), ...textList([personal.city, personal.state].filter(Boolean))]
  const employmentTypes = textList(preferences.employmentTypes || preferences.employment_types).map((value) => value.replaceAll(' ', '_').replaceAll('-', '_'))
  const excluded = new Set([...savedJobIds, ...applications.map((item) => item.jobId || item.job_id || item.job?.id)].filter(Boolean).map(String))
  return (jobs || []).map((job) => {
    const id = String(job.id || job.jobId || '')
    const status = normalizedText(job.status || job.jobStatus || job.job_status)
    if (!id || excluded.has(id) || ['closed', 'inactive', 'draft', 'rejected', 'filled', 'expired'].includes(status) || job.isActive === false || job.is_active === false) return null
    const title = normalizedText(job.title)
    const specialty = normalizedText(job.specialty || job.department)
    const jobLocation = normalizedText(job.location)
    const type = normalizedText(job.type).replaceAll(' ', '_').replaceAll('-', '_')
    let score = 0
    for (const term of wanted) {
      if (term.length < 2) continue
      const variants = term.includes('nurs') ? ['nurse', 'nursing'] : term.includes('cardio') ? ['cardiology', 'cardiac'] : term.includes('critical care') || term === 'icu' ? ['icu', 'critical care'] : term.includes('emergency') || term === 'er' ? ['emergency', 'emt', 'er'] : [term]
      if (variants.some((variant) => specialty === variant)) score += 5
      else if (variants.some((variant) => specialty.includes(variant) || variant.includes(specialty))) score += 3
      if (variants.some((variant) => title.includes(variant))) score += 2
    }
    if (locations.some((location) => location.length > 1 && jobLocation.includes(location))) score += 3
    if (employmentTypes.includes(type)) score += 1
    return score ? { job, score } : null
  }).filter(Boolean).sort((a, b) => b.score - a.score).map(({ job }) => job)
}
