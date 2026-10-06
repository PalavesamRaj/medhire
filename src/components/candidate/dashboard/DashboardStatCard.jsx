import React from 'react'
import CandidateIcon from './CandidateIcon'
export default function DashboardStatCard({ label, value, icon, description, progress }) {
  return <div className="med-card min-w-0"><div className="flex items-start justify-between gap-3"><h2 className="med-caption text-ink-600">{label}</h2>{progress !== undefined ? <span role="img" aria-label={`${progress}% complete`} className="h-8 w-8 shrink-0 rounded-full p-1" style={{ background: `conic-gradient(#2563eb ${progress}%, #e2e8f0 0)` }}><span className="block h-full w-full rounded-full bg-white" /></span> : <CandidateIcon name={icon} className="h-5 w-5 text-brand-600" />}</div><p className="med-display-sm mt-3">{value}</p>{description && <p className="med-caption mt-2 text-ink-400">{description}</p>}</div>
}
