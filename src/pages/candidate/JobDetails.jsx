import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import ProfileSection from '../../components/candidate/dashboard/ProfileSection'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'
import { SaveJobButton, formatDate } from '../../components/candidate/dashboard/JobCard'

export function JobNotFound() { return <><PageHeading title="Job not found" subtitle="This opportunity is no longer available or the link is incorrect." /><Link className="med-action" to="/candidate/jobs">Back to Job Search</Link></> }
export default function JobDetails() {
  const { jobId } = useParams()
  const { jobs } = useCandidateDashboard()
  const job = jobs.find((item) => item.id === jobId)
  if (!job) return <JobNotFound />
  return <><section className="med-card flex flex-wrap items-start justify-between gap-5"><div className="min-w-0"><h1 className="med-display-sm">{job.title}</h1><div className="mt-3 flex flex-wrap items-center gap-3"><p className="med-body font-semibold">{job.hospital}</p><p className="med-caption text-ink-600">{job.location}</p><StatusBadge status={job.type} /></div><p className="med-caption mt-2 text-ink-400">Posted {formatDate(job.posted)}</p></div><div className="flex shrink-0 flex-wrap gap-3 sm:flex-col"><Link to={`/candidate/jobs/${job.id}/apply`} className="med-action med-action-primary">Apply Now</Link><SaveJobButton job={job} label /></div></section><div className="grid items-start gap-4 xl:grid-cols-2"><div className="space-y-4"><ProfileSection title="About the Role"><p className="med-body text-ink-600">{job.description}</p></ProfileSection><ProfileSection title="Responsibilities"><ul className="med-body list-disc space-y-2 pl-5 text-ink-600">{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></ProfileSection></div><div className="space-y-4"><ProfileSection title="Requirements"><ul className="med-body list-disc space-y-2 pl-5 text-ink-600">{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul></ProfileSection><ProfileSection title="Position Details"><dl className="grid grid-cols-2 gap-4">{[['Salary', job.salary], ['Shift', job.shift], ['Specialty', job.specialty], ['Employment', job.type]].map(([label, value]) => <div key={label}><dt className="med-caption text-ink-400">{label}</dt><dd className="med-body mt-1">{value}</dd></div>)}</dl></ProfileSection></div></div></>
}
