import React from 'react'
import { Link } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import DashboardStatCard from '../../components/candidate/dashboard/DashboardStatCard'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'
import JobCard from '../../components/candidate/dashboard/JobCard'
import RecentActivity from '../../components/candidate/dashboard/RecentActivity'
import { recommendedJobIds } from '../../lib/candidateMockData'

export default function CandidateDashboard() {
  const { candidate, metrics, privacy, jobs } = useCandidateDashboard()
  return <>
    <PageHeading title={`Welcome back, ${candidate.firstName}`} subtitle="Here’s what’s happening with your career profile.">{privacy.openToWork && <StatusBadge status="Open to Work" />}</PageHeading>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatCard label="Profile Views" value={metrics.profileViews} icon="eye-off" /><DashboardStatCard label="Applications" value={metrics.applications} icon="file-text" /><DashboardStatCard label="Saved Jobs" value={metrics.savedJobs} icon="bookmark" /><DashboardStatCard label="Profile Strength" value={`${metrics.profileStrength}%`} progress={metrics.profileStrength} /></div>
    <div className="grid items-start gap-4 xl:grid-cols-2"><div className="med-card flex flex-wrap items-center gap-4"><img src={candidate.photo} alt="" className="h-14 w-14 rounded-full" /><div className="min-w-0 flex-1"><Link to="/candidate/profile" className="med-heading-3">{candidate.firstName} {candidate.lastName}</Link><p className="med-body text-ink-600">{candidate.headline || 'Add your professional title'}</p><p className="med-caption mt-1 text-ink-400">{candidate.location || 'Add your location'}</p></div>{privacy.openToWork && <StatusBadge status="Open to Work" />}</div><section className="med-card"><div className="flex justify-between gap-3"><h2 className="med-heading-3">Profile Completion</h2><span className="med-body font-semibold text-brand-600">{metrics.profileStrength}%</span></div><div role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={metrics.profileStrength} className="mt-3 h-2.5 rounded-full bg-brand-50"><div style={{ width: `${metrics.profileStrength}%` }} className="h-full rounded-full bg-green-600" /></div><p className="med-caption mt-3 text-ink-600">{metrics.profileStrength === 100 ? 'Your professional profile is complete.' : 'Keep your experience and credentials up to date to stand out.'}</p></section></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]"><section><h2 className="med-heading-2 mb-4">Recommended Jobs</h2><div className="grid gap-3 md:grid-cols-3">{recommendedJobIds.map((id) => jobs.find((job) => job.id === id)).filter(Boolean).map((job) => <JobCard key={job.id} job={job} compact />)}</div></section><RecentActivity /></div>
  </>
}
