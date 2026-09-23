import React from 'react'
import { NavLink } from 'react-router-dom'
import CandidateIcon from './CandidateIcon'

export const candidateNavigation = [
  ['Dashboard', '/candidate/dashboard', 'layout-dashboard'],
  ['My Profile', '/candidate/profile', 'user-square'],
  ['Edit Profile', '/candidate/edit-profile', 'edit-3'],
  ['Resume Management', '/candidate/resume-management', 'file-text'],
  ['Privacy Settings', '/candidate/privacy-settings', 'settings-2'],
  ['Job Search', '/candidate/jobs', 'user-search'],
  ['My Applications', '/candidate/applications', 'app-window'],
  ['Saved Jobs', '/candidate/saved-jobs', 'bookmark'],
  ['Summary', '/candidate/summary', 'chart-column'],
]
export default function CandidateSidebar({ open, onNavigate }) {
  return <aside id="candidate-navigation" className={`${open ? 'block' : 'hidden'} border-b border-ink-200 bg-white px-4 py-5 lg:sticky lg:top-[72px] lg:block lg:h-[calc(100dvh-72px)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r`}>
    <nav aria-label="Candidate navigation" className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{candidateNavigation.map(([label, to, icon]) => <NavLink key={to} to={to} end={to !== '/candidate/jobs'} onClick={onNavigate} className={({ isActive }) => `med-body flex items-center gap-3 rounded-md px-3 py-3 ${isActive ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-600 hover:bg-ink-50'}`}><CandidateIcon name={icon} className="h-[18px] w-[18px]" />{label}</NavLink>)}</nav>
  </aside>
}
