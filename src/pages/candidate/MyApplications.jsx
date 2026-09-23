import React, { useState } from 'react'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import DashboardStatCard from '../../components/candidate/dashboard/DashboardStatCard'
import JobCard from '../../components/candidate/dashboard/JobCard'
import { Input, Select } from '../../components/ui/FormControls'
import { EmptyState } from '../../components/ui/DataDisplay'
import { applicationStatuses } from '../../lib/candidateMockData'

export default function MyApplications() {
  const { applications, jobs } = useCandidateDashboard()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const rows = applications.map((application) => ({ application, job: jobs.find((job) => job.id === application.jobId) })).filter(({ application, job }) => job && (!status || application.status === status) && `${job.title} ${job.hospital}`.toLowerCase().includes(query.trim().toLowerCase()))
  const count = (value) => applications.filter((application) => application.status === value).length
  return <><PageHeading title="My Applications" subtitle="Track your submitted applications" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatCard label="Total Applications" value={applications.length} icon="file-text" /><DashboardStatCard label="Under Review" value={count('Under Review')} icon="eye-off" /><DashboardStatCard label="Interviews" value={count('Interview')} icon="app-window" /><DashboardStatCard label="Hired" value={count('Hired')} icon="circle-check" /></div><div className="flex flex-col gap-3 sm:flex-row"><Input type="search" aria-label="Search applications" placeholder="Search by job title or hospital…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1" /><Select aria-label="Application status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{applicationStatuses.map((value) => <option key={value}>{value}</option>)}</Select></div><p role="status" className="med-caption text-ink-600">{rows.length} applications</p><div className="space-y-4">{rows.length ? rows.map(({ application, job }) => <JobCard key={application.id} application={application} job={job} />) : <EmptyState title="No applications found" message="Applications matching your search will appear here. Explore Job Search to find your next opportunity." />}</div></>
}
