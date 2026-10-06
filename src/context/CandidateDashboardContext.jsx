import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { useCandidateProfile } from './CandidateProfileContext'
import { candidateFromProfile, createDashboardState, dashboardReducer, normalizeJob } from '../lib/candidateDashboardState'
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
      const jobRecords = jobs ? listFrom(jobs, ['jobs', 'results']) : []
      const mergedJobs = [...jobRecords, ...savedRecords.map((item) => item.job).filter(Boolean), ...applicationRecords.map((item) => item.job).filter(Boolean)]
      dispatch({ type: 'load', data: {
        jobs: mergedJobs.map(normalizeJob).filter((job, index, all) => all.findIndex((item) => item.id === job.id) === index),
        applications: applicationRecords,
        savedJobIds: savedRecords.map((item) => typeof item === 'string' ? item : item.jobId || item.job?.id || item.id).filter(Boolean),
        resumes: resumes ? listFrom(resumes, ['resumes', 'items']).map((item) => ({ ...item, id: item.id || item.resumeId, name: item.name || item.fileName, uploaded: item.uploaded || item.uploadedAt, status: item.status || item.approvalStatus, active: Boolean(item.active) })) : [],
        activities: dashboard ? dashboard.recentActivity || dashboard.activities || [] : [],
        privacy: privacy ? (() => {
          const values = privacy.privacy || privacy
          return { maskContact: values.maskContact ?? values.contactVisible === false, searchable: values.searchable ?? values.recruiterDiscoverable ?? values.profileVisible ?? false, shareSavedJobs: values.shareSavedJobs ?? false, resumeVisible: values.resumeVisible ?? false, openToWork: values.openToWork ?? false, emailNotifications: values.emailNotifications ?? false, twoFactor: values.twoFactor ?? false }
        })() : {},
        metrics: { ...(dashboard || {}), ...(dashboard?.metrics || {}), ...(summary || {}), ...(summary?.metrics || {}) },
        summary: summary?.data || summary || {},
        error: failures.length ? 'Some account data could not be loaded. Check the backend connection and refresh.' : '',
      } })
    })
    return () => { active = false }
  }, [])
  const candidate = { ...candidateFromProfile(profile), ...state.edits }
  const metrics = { profileViews: state.metrics.profileViews ?? 0, profileStrength: getCandidateProfileCompletion(profile).percentage, applications: state.metrics.applications ?? state.applications.length, savedJobs: state.metrics.savedJobs ?? state.savedJobIds.length, timesUnlocked: state.metrics.timesUnlocked ?? 0, interviews: state.metrics.interviews ?? state.applications.filter((application) => application.status === 'Interview').length }
  return <DashboardContext.Provider value={{ ...state, candidate, metrics, dispatch }}>{children}</DashboardContext.Provider>
}
export function useCandidateDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useCandidateDashboard must be used inside CandidateDashboardProvider')
  return context
}
