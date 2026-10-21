import React from 'react'
import { Link } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import JobCard from '../../components/candidate/dashboard/JobCard'
import { EmptyState } from '../../components/ui/DataDisplay'
export default function SavedJobs() {
  const { savedJobIds, jobs } = useCandidateDashboard()
  const saved = savedJobIds.map((id) => jobs.find((job) => job.id === id)).filter(Boolean)
  return <><PageHeading title="Saved Jobs" subtitle="Jobs you’ve bookmarked for later" /><div className="space-y-4">{saved.length ? saved.map((job) => <JobCard key={job.id} job={job} savedActions />) : <><EmptyState title="No saved jobs yet" message="Bookmark opportunities from Job Search to find them here." /><Link to="/candidate/jobs" className="med-action med-action-primary">Browse Jobs</Link></>}</div></>
}
