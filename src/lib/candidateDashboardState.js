export const hasSetupProfile = (profile) => Boolean(Object.keys(profile.personalInformation || {}).length || Object.keys(profile.professionalInformation || {}).length || profile.education?.length)
export function normalizeJob(job = {}) {
  return { ...job, id: job.id || job.jobId || job._id, title: job.title || job.jobTitle, hospital: job.hospital || job.organizationName || job.companyName, location: job.location || job.city, type: job.type || job.employmentType, specialty: job.specialty || job.department, posted: job.posted || job.postedAt, responsibilities: job.responsibilities || [], requirements: job.requirements || [] }
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
