import React from 'react'
import { Link } from 'react-router-dom'
import CandidateIcon from './CandidateIcon'
import StatusBadge from './StatusBadge'
import { useCandidateDashboard } from '../../../context/CandidateDashboardContext'
import { useToast } from '../../ui/ToastProvider'
export function SaveJobButton({ job, label = false }) {
  const { savedJobIds, dispatch } = useCandidateDashboard()
  const toast = useToast()
  const saved = savedJobIds.includes(job.id)
  return <button type="button" aria-label={`${saved ? 'Unsave' : 'Save'} ${job.title}`} aria-pressed={saved} onClick={() => { dispatch({ type: 'save-job', id: job.id }); toast(saved ? 'Job removed from saved jobs.' : 'Job saved.') }} className={label ? 'med-action' : `rounded-md p-2 ${saved ? 'bg-brand-50 text-brand-600' : 'text-ink-900 hover:bg-ink-50'}`}><CandidateIcon name={saved ? 'bookmark-check' : 'bookmark'} className="h-4 w-4" />{label && (saved ? 'Saved Job' : 'Save Job')}</button>
}
export const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
export default function JobCard({ job, compact = false, application, savedActions = false }) {
  const { dispatch } = useCandidateDashboard()
  const toast = useToast()
  return <article className={`med-card ${compact ? '!p-4' : ''}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="med-heading-3">{job.title}</h3><p className="med-body mt-1 text-ink-600">{job.hospital}</p><p className="med-caption mt-1 text-ink-400">{job.location}</p></div><SaveJobButton job={job} /></div><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={application?.status || job.type} /></div>{!compact && <p className="med-caption mt-2 text-ink-400">{application ? `Applied ${formatDate(application.applied)}` : `Posted ${formatDate(job.posted)}`}</p>}<div className="mt-3 flex flex-wrap gap-2"><Link className="med-action" to={`/candidate/jobs/${job.id}`}>View Details</Link>{savedActions && <><button type="button" className="med-action text-red-600" onClick={() => { dispatch({ type: 'save-job', id: job.id }); toast('Job removed from saved jobs.') }}>Remove</button><Link className="med-action text-brand-600" to={`/candidate/jobs/${job.id}/apply`}>Apply</Link></>}</div></article>
}
