import React from 'react'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import DashboardStatCard from '../../components/candidate/dashboard/DashboardStatCard'
import RecentActivity from '../../components/candidate/dashboard/RecentActivity'
import ProfilePerformance from '../../components/candidate/dashboard/ProfilePerformance'
import { demoPerformance } from '../../lib/candidateMockData'
export default function CandidateSummary() {
  const { metrics } = useCandidateDashboard()
  return <><PageHeading title="Summary" subtitle="Your candidate analytics overview" /><div className="grid gap-4 sm:grid-cols-2"><DashboardStatCard label="Profile Strength" value={`${metrics.profileStrength}%`} progress={metrics.profileStrength} description="Based on profile completion" /><DashboardStatCard label="Applications Sent" value={metrics.applications} icon="file-text" description="Total submitted applications" /><DashboardStatCard label="Times Unlocked" value={metrics.timesUnlocked} icon="user-square" description="Recruiters who accessed your full profile" /><DashboardStatCard label="Interviews Scheduled" value={metrics.interviews} icon="app-window" description="Applications at the interview stage" /></div><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"><ProfilePerformance data={metrics.profileViews ? demoPerformance : demoPerformance.map((item) => ({ ...item, value: 0 }))} /><RecentActivity limit={5} /></div></>
}
