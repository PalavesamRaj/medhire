import React from 'react'
import CandidateIcon from './CandidateIcon'
import { useCandidateDashboard } from '../../../context/CandidateDashboardContext'
export default function RecentActivity({ limit = 3 }) {
  const { activities } = useCandidateDashboard()
  return <section><h2 className="med-heading-2 mb-4">Recent Activity</h2><div className="med-card">{activities.length ? <ul className="space-y-5">{activities.slice(0, limit).map((activity) => <li key={activity.id} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><CandidateIcon name={activity.icon} className="h-4 w-4" /></span><div><p className="med-body font-semibold">{activity.text}</p><p className="med-caption mt-1 text-ink-400">{activity.time}</p></div></li>)}</ul> : <p className="med-body text-ink-600">Your recent activity will appear here.</p>}</div></section>
}
