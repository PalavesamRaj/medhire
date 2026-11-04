import React from 'react'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import DashboardStatCard from '../../components/candidate/dashboard/DashboardStatCard'
export default function CandidateSummary() {
  const { metrics } = useCandidateDashboard()
  const { loading: profileLoading } = useCandidateProfile()
  const profileStrength = profileLoading ? null : metrics.profileStrength
  return <><PageHeading title="Summary" subtitle="Your candidate analytics overview" /><div className="grid gap-4 sm:grid-cols-2"><DashboardStatCard label="Profile Strength" value={profileLoading ? 'Loading…' : `${profileStrength}%`} progress={profileStrength ?? 0} description="Based on profile completion" /><DashboardStatCard label="Applications Sent" value={metrics.applications} icon="file-text" description="Total submitted applications" /><DashboardStatCard label="Times Unlocked" value={metrics.timesUnlocked} icon="user-square" description="Recruiters who accessed your full profile" /><DashboardStatCard label="Interviews Scheduled" value={metrics.interviews} icon="app-window" description="Applications at the interview stage" /></div></>
}
