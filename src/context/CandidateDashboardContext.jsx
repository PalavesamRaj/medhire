import React, { createContext, useContext, useReducer } from 'react'
import { useCandidateProfile } from './CandidateProfileContext'
import { candidateFromProfile, createDashboardState, dashboardReducer, hasSetupProfile } from '../lib/candidateDashboardState'
import { demoMetrics } from '../lib/candidateMockData'

const DashboardContext = createContext(null)
export function CandidateDashboardProvider({ children }) {
  const { profile } = useCandidateProfile()
  const [state, dispatch] = useReducer(dashboardReducer, profile, createDashboardState)
  const candidate = { ...candidateFromProfile(profile), ...state.edits }
  const ownProfile = hasSetupProfile(profile)
  const strength = ownProfile ? Math.round([candidate.firstName !== 'Candidate', candidate.lastName, candidate.headline, candidate.location, candidate.summary, candidate.education.length, candidate.workExperience.length, candidate.skills.length, candidate.certifications.length, state.resumes.length].filter(Boolean).length * 10) : demoMetrics.profileStrength
  const metrics = { profileViews: ownProfile ? 0 : demoMetrics.profileViews, profileStrength: strength, applications: state.applications.length, savedJobs: state.savedJobIds.length, timesUnlocked: ownProfile ? 0 : demoMetrics.timesUnlocked, interviews: state.applications.filter((application) => application.status === 'Interview').length }
  return <DashboardContext.Provider value={{ ...state, candidate, metrics, dispatch }}>{children}</DashboardContext.Provider>
}
export function useCandidateDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useCandidateDashboard must be used inside CandidateDashboardProvider')
  return context
}
