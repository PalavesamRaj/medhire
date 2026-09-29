import React from 'react'
import { BadgeDollarSign, Bookmark, Building2, CreditCard, LayoutDashboard, Search, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export const recruiterNavigation = [
  ['Dashboard', '/recruiter/dashboard', LayoutDashboard],
  ['Find Candidates', '/recruiter/find-candidates', Search],
  ['Purchased Candidates', '/recruiter/purchased-candidates', Users],
  ['Shortlisted Candidates', '/recruiter/shortlisted-candidates', Bookmark],
  ['Plans & Credits', '/recruiter/plans-credits', BadgeDollarSign],
  ['Payment History', '/recruiter/payment-history', CreditCard],
  ['Hospital Profile', '/recruiter/hospital-profile', Building2],
]

export default function RecruiterSidebar({ open, onNavigate }) {
  return (
    <aside
      id="recruiter-navigation"
      className={`${open ? 'block' : 'hidden'} border-b border-slate-200 bg-white px-4 py-5 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r`}
    >
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Recruiter Portal</span>
        <button type="button" onClick={onNavigate} aria-label="Close navigation" className="rounded p-1 text-slate-500 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav aria-label="Recruiter navigation" className="grid gap-1">
        {recruiterNavigation.map(([label, to, Icon]) => (
          <NavLink
            key={label}
            to={to}
            end={label === 'Dashboard'}
            onClick={onNavigate}
            className={({ isActive }) => `flex h-10 items-center gap-2.5 rounded-md px-3 text-xs ${isActive ? 'bg-blue-50 font-bold text-blue-600' : 'font-medium text-slate-500 hover:bg-slate-50'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
