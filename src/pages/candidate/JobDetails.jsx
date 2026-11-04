import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import ProfileSection from '../../components/candidate/dashboard/ProfileSection'
import PageHeading from '../../components/candidate/dashboard/PageHeading'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'
import { SaveJobButton, formatDate } from '../../components/candidate/dashboard/JobCard'
import { candidateDashboardApi } from '../../lib/candidateDashboardApi'
import { formatEmploymentType, normalizeJob } from '../../lib/candidateDashboardState'
import { formatINRRange } from '../../lib/currency'

export function JobNotFound() { return <><PageHeading title="Job not found" subtitle="This opportunity is no longer available or the link is incorrect." /><Link className="med-action" to="/candidate/jobs">Back to Job Search</Link></> }
export default function JobDetails() {
  const { jobId } = useParams()
  const { jobs } = useCandidateDashboard()
  const cached = jobs.find((item) => item.id === jobId)
  const [job, setJob] = useState(cached || null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    candidateDashboardApi.getJobDetails(jobId).then((response) => {
      if (!active) return
      const data = response?.data || response || {}
      const detail = normalizeJob({ ...cached, ...(data.job || data), id: (data.job || data).id || (data.job || data).jobId || jobId })
      setJob(detail.id ? detail : null)
    }).catch(() => { if (active) setJob(cached || null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [cached, jobId])
  if (loading) return <PageHeading title="Loading opportunity…" subtitle="Fetching current job details" />
  if (!job) return <JobNotFound />
  const salary = job.salary != null && job.salary !== '' ? formatINRRange(job.salary) : ''
  return <><section className="med-card flex flex-wrap items-start justify-between gap-5"><div className="min-w-0"><h1 className="med-display-sm">{job.title}</h1><div className="mt-3 flex flex-wrap items-center gap-3"><p className="med-body font-semibold">{job.hospital || 'Hospital not specified'}</p><p className="med-caption text-ink-600">{job.location || 'Location not specified'}</p>{job.type && <StatusBadge status={formatEmploymentType(job.type)} />}</div>{job.posted && <p className="med-caption mt-2 text-ink-400">Posted {formatDate(job.posted)}</p>}</div><div className="flex shrink-0 flex-wrap gap-3 sm:flex-col"><Link to={`/candidate/jobs/${job.id}/apply`} className="med-action med-action-primary">Apply Now</Link><SaveJobButton job={job} label /></div></section><div className="grid items-start gap-4 xl:grid-cols-2"><div className="space-y-4"><ProfileSection title="About the Role"><p className="med-body whitespace-pre-line text-ink-600">{job.description || 'No role description was provided.'}</p></ProfileSection><ProfileSection title="Responsibilities">{job.responsibilities.length ? <ul className="med-body list-disc space-y-2 pl-5 text-ink-600">{job.responsibilities.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="med-body text-ink-600">Responsibilities are included in the role description above.</p>}</ProfileSection></div><div className="space-y-4"><ProfileSection title="Requirements">{job.requirements.length ? <ul className="med-body list-disc space-y-2 pl-5 text-ink-600">{job.requirements.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="med-body text-ink-600">No specific requirements were listed.</p>}</ProfileSection><ProfileSection title="Position Details"><dl className="grid grid-cols-2 gap-4">{[['Salary', salary], ['Shift', job.shift], ['Work setting', job.workSetting], ['Specialty', job.specialty], ['Employment', job.type ? formatEmploymentType(job.type) : '']].map(([label, value]) => <div key={label}><dt className="med-caption text-ink-400">{label}</dt><dd className="med-body mt-1">{value || 'Not specified'}</dd></div>)}</dl></ProfileSection></div></div></>
}
