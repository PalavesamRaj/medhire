import { demoCandidate, demoJobs, demoApplications, demoResumes, demoActivities, demoPrivacy } from './candidateMockData'

export const hasSetupProfile = (profile) => Boolean(Object.keys(profile.personalInformation || {}).length || Object.keys(profile.professionalInformation || {}).length || profile.education?.length)
export function candidateFromProfile(profile) {
  if (!hasSetupProfile(profile)) return demoCandidate
  const personal = profile.personalInformation || {}
  const professional = profile.professionalInformation || {}
  return { firstName: personal.firstName || 'Candidate', lastName: personal.lastName || '', headline: professional.currentJobTitle || '', location: [personal.city, personal.state].filter(Boolean).join(', '), summary: professional.professionalSummary || '', photo: demoCandidate.photo, professionalInformation: professional, education: profile.education || [], workExperience: profile.workExperience || [], skills: profile.skills || [], certifications: profile.certifications || [] }
}
export function createDashboardState(profile) {
  const ownProfile = hasSetupProfile(profile)
  return { edits: {}, jobs: demoJobs, applications: ownProfile ? [] : [...demoApplications], savedJobIds: ownProfile ? [] : demoJobs.slice(0, 3).map((job) => job.id), resumes: ownProfile ? (profile.resume ? [{ id: 'onboarding-resume', name: profile.resume.name, file: profile.resume, uploaded: new Date().toISOString(), status: 'Pending Review', active: false }] : []) : [...demoResumes], activities: ownProfile ? [] : [...demoActivities], privacy: { ...demoPrivacy } }
}
export function dashboardReducer(state, action) {
  switch (action.type) {
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
  const includes = (value, query) => value.toLowerCase().includes((query || '').trim().toLowerCase())
  return jobs.filter((job) => includes(`${job.title} ${job.hospital} ${job.specialty}`, filters.q) && includes(job.hospital, filters.hospital) && includes(job.location, filters.location) && (!filters.type || filters.type === 'All' || job.type === filters.type) && (!filters.specialty || job.specialty === filters.specialty))
}
