import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { useCandidateProfile } from './CandidateProfileContext'
import { candidateFromProfile, createDashboardState, dashboardReducer, normalizeApplication, normalizeJob, recommendJobs } from '../lib/candidateDashboardState'
import { getAccessToken } from '../lib/authSession'
import { candidateDashboardApi } from '../lib/candidateDashboardApi'
import { getCandidateProfileCompletion } from '../lib/candidateProfileCompletion'

const DashboardContext = createContext(null)
const unwrap = (response) => response?.data || response || {}
const listFrom = (response, keys) => {
  const data = unwrap(response)
  if (Array.isArray(data)) return data
  for (const key of keys) if (Array.isArray(data[key])) return data[key]
  return []
}
const applicationActivities = (applications) => applications.map((application) => {
  const job = application.job || {}
  const title = application.jobTitle || application.job_title || job.title || job.jobTitle || job.job_title || 'a job'
  const hospital = application.hospitalName || application.hospital_name || job.hospitalName || job.hospital_name || job.hospital?.name || job.hospital || ''
  const date = application.appliedAt || application.applied_at || application.createdAt || application.created_at
  const time = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleDateString() : 'Application submitted'
  return { id: application.id || application.applicationId || `${title}-${date || ''}`, icon: 'send-horizontal', text: `Applied for ${title}${hospital ? ` at ${hospital}` : ''}`, time }
})
const normalizeActivity = (event = {}, index = 0) => {
  const type = String(event.type || event.eventType || event.event_type || '').toUpperCase()
  const timestamp = event.createdAt || event.created_at || event.timestamp || event.date
  const text = event.text || event.message || event.title || event.description || ({
    PROFILE_UNLOCKED: 'A recruiter viewed your full profile', CANDIDATE_PROFILE_UNLOCKED: 'A recruiter viewed your full profile',
    PROFILE_VIEWED: 'A recruiter viewed your profile', APPLICATION_SUBMITTED: 'You applied for a job',
  }[type]) || 'Account activity'
  return { ...event, id: event.id || event.activityId || event.activity_id || `${type || 'activity'}-${timestamp || index}`, icon: event.icon || (/APPLICATION|APPLIED/.test(type) ? 'send-horizontal' : 'file-text'), text, time: event.time || (timestamp && !Number.isNaN(Date.parse(timestamp)) ? new Date(timestamp).toLocaleString() : 'Recently') }
}
const normalizeActivities = (events) => Array.isArray(events) ? events.map(normalizeActivity).sort((a, b) => Date.parse(b.createdAt || b.created_at || b.timestamp || b.date || 0) - Date.parse(a.createdAt || a.created_at || a.timestamp || a.date || 0)) : []
const RESUME_STATUS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' }
const asBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === 0) return value === 1
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.toLowerCase())) return true
    if (['false', '0', 'no'].includes(value.toLowerCase())) return false
  }
  return undefined
}
function normalizePrivacy(response) {
  let values = unwrap(response)
  for (const key of ['privacy', 'settings', 'preferences']) {
    if (values?.[key] && typeof values[key] === 'object') { values = values[key]; break }
  }
  const profileVisible = asBoolean(values.profileVisible ?? values.profile_visible)
  const recruiterDiscoverable = asBoolean(values.recruiterDiscoverable ?? values.recruiter_discoverable)
  const resumeVisible = asBoolean(values.resumeVisible ?? values.resume_visible)
  const contactVisible = asBoolean(values.contactVisible ?? values.contact_visible)
  const openToWork = asBoolean(values.openToWork ?? values.open_to_work)
  const maskContact = asBoolean(values.maskContact ?? values.mask_contact)
  return {
    ...(maskContact !== undefined || contactVisible !== undefined ? { maskContact: maskContact ?? !contactVisible } : {}),
    ...(profileVisible !== undefined || recruiterDiscoverable !== undefined || asBoolean(values.searchable) !== undefined ? { searchable: recruiterDiscoverable ?? profileVisible ?? asBoolean(values.searchable) } : {}),
    ...(resumeVisible !== undefined ? { resumeVisible } : {}),
    ...(openToWork !== undefined ? { openToWork } : {}),
  }
}
export function CandidateDashboardProvider({ children }) {
  const { profile } = useCandidateProfile()
  const [state, dispatch] = useReducer(dashboardReducer, profile, createDashboardState)
  useEffect(() => {
    let active = true
    if (!getAccessToken()) {
      dispatch({ type: 'load', data: { jobs: [], applications: [], savedJobIds: [], resumes: [], activities: [], privacy: {}, metrics: {} } })
      return () => { active = false }
    }
    Promise.allSettled([
      candidateDashboardApi.getDashboard(), candidateDashboardApi.searchJobs(), candidateDashboardApi.getApplications(),
      candidateDashboardApi.getSavedJobs(), candidateDashboardApi.getResume(), candidateDashboardApi.getPrivacySettings(), candidateDashboardApi.getCandidateSummary(),
    ]).then((results) => {
      if (!active) return
      const [dashboard, jobs, applications, saved, resumes, privacy, summary] = results.map((result) => result.status === 'fulfilled' ? unwrap(result.value) : null)
      const failures = results.filter((result) => result.status === 'rejected')
      const savedRecords = saved ? listFrom(saved, ['savedJobs', 'jobs', 'results']) : []
      const applicationRecords = applications ? listFrom(applications, ['applications', 'results']) : []
      const dashboardActivities = dashboard?.recentActivity || dashboard?.recentActivities || dashboard?.activities || dashboard?.activity
      const jobRecords = jobs ? listFrom(jobs, ['jobs', 'results']) : []
      const mergedJobs = [...jobRecords, ...savedRecords.map((item) => item.job).filter(Boolean), ...applicationRecords.map((item) => item.job).filter(Boolean)]
      dispatch({ type: 'load', data: {
        jobs: mergedJobs.map(normalizeJob).filter((job, index, all) => all.findIndex((item) => item.id === job.id) === index),
        applications: applicationRecords.map(normalizeApplication),
        savedJobIds: savedRecords.map((item) => typeof item === 'string' ? item : item.jobId || item.job?.id || item.id).filter(Boolean),
        resumes: resumes ? listFrom(resumes, ['resumes', 'items']).map((item) => ({ ...item, id: item.id || item.resumeId, name: item.name || item.fileName, uploaded: item.uploaded || item.uploadedAt, status: RESUME_STATUS[String(item.approvalStatus || item.status || '').toUpperCase()] || 'Pending', rejectionReason: item.rejectionReason ?? null, reviewedAt: item.reviewedAt ?? null, active: item.active === true })) : [],
        activities: Array.isArray(dashboardActivities) && dashboardActivities.length ? normalizeActivities(dashboardActivities) : normalizeActivities(applicationActivities(applicationRecords)),
        privacy: privacy ? normalizePrivacy(privacy) : {},
        metrics: { ...(dashboard || {}), ...(dashboard?.metrics || {}), ...(summary || {}), ...(summary?.metrics || {}) },
        summary: summary?.data || summary || {},
        error: failures.length ? 'Some account data could not be loaded. Check the backend connection and refresh.' : '',
      } })
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!getAccessToken()) return undefined
    let active = true
    const refreshDashboard = async () => {
      try {
        const dashboard = unwrap(await candidateDashboardApi.getDashboard())
        if (!active) return
        const metrics = { ...(dashboard || {}), ...(dashboard?.metrics || {}) }
        const events = dashboard?.recentActivity || dashboard?.recentActivities || dashboard?.activities || dashboard?.activity
        dispatch({ type: 'dashboard-update', metrics, activities: Array.isArray(events) && events.length ? normalizeActivities(events) : undefined })
      } catch { /* Keep the last successful dashboard values visible. */ }
    }
    const timer = window.setInterval(refreshDashboard, 60000)
    const onVisible = () => { if (document.visibilityState === 'visible') refreshDashboard() }
    window.addEventListener('focus', refreshDashboard)
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refreshDashboard); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  const candidate = { ...candidateFromProfile(profile), ...state.edits }
  const metrics = { profileViews: state.metrics.profileViews ?? state.metrics.profile_views ?? state.metrics.profileViewCount ?? state.metrics.profile_view_count ?? 0, profileStrength: getCandidateProfileCompletion(profile, { hasSavedResume: state.resumes.length > 0 }).percentage, applications: state.metrics.applications ?? state.applications.length, savedJobs: state.metrics.savedJobs ?? state.savedJobIds.length, timesUnlocked: state.metrics.timesUnlocked ?? state.metrics.times_unlocked ?? state.metrics.unlockCount ?? state.metrics.unlock_count ?? 0, interviews: state.metrics.interviewsScheduled ?? state.metrics.interviews_scheduled ?? state.metrics.interviewCount ?? state.metrics.interview_count ?? state.metrics.interviews ?? state.applications.filter((application) => application.interviewScheduled || application.status === 'Interview').length }
  const recommendedJobs = useMemo(() => recommendJobs(state.jobs, profile, { applications: state.applications, savedJobIds: state.savedJobIds }), [state.jobs, profile, state.applications, state.savedJobIds])
  return <DashboardContext.Provider value={{ ...state, candidate, metrics, recommendedJobs, dispatch }}>{children}</DashboardContext.Provider>
}
export function useCandidateDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useCandidateDashboard must be used inside CandidateDashboardProvider')
  return context
}
