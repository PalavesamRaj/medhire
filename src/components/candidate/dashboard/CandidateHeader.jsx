import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Input } from '../../ui/FormControls'
import CandidateIcon, { candidateAsset } from './CandidateIcon'
import { useCandidateDashboard } from '../../../context/CandidateDashboardContext'

export default function CandidateHeader({ menuOpen, onToggleMenu }) {
  const { candidate, activities } = useCandidateDashboard()
  const [query, setQuery] = useState('')
  const [notifications, setNotifications] = useState(false)
  const navigate = useNavigate()
  return <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-ink-200 bg-white px-4 py-3 sm:px-7">
    <div className="flex items-center gap-3"><button type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="candidate-navigation" onClick={onToggleMenu} className="rounded-lg p-2 text-ink-600 hover:bg-ink-50 lg:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><Link to="/candidate/dashboard" className="flex items-center gap-2"><span className="rounded-md bg-accent-50 p-1.5"><img src={candidateAsset('stethoscope')} alt="" className="h-5 w-5" /></span><span className="med-heading-2 font-bold">MedHire</span></Link></div>
    <form role="search" aria-label="Global job search" onSubmit={(event) => { event.preventDefault(); navigate(`/candidate/jobs?q=${encodeURIComponent(query.trim())}`); setNotifications(false) }} className="relative order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-md"><CandidateIcon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-600" /><Input type="search" aria-label="Search jobs, hospitals, specialties" placeholder="Search jobs, hospitals, specialties…" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-ink-50 !pl-10" /></form>
    <div className="flex items-center gap-3"><div className="relative"><button type="button" aria-label="Notifications" aria-expanded={notifications} aria-controls="candidate-notifications" onClick={() => setNotifications(!notifications)} onKeyDown={(event) => { if (event.key === 'Escape') setNotifications(false) }} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 hover:bg-ink-100"><CandidateIcon name="bell" /></button>{notifications && <section id="candidate-notifications" aria-label="Recent notifications" onKeyDown={(event) => { if (event.key === 'Escape') setNotifications(false) }} className="absolute right-0 top-12 z-40 w-[min(320px,80vw)] rounded-xl border border-ink-200 bg-white p-4 shadow-lg"><h2 className="med-heading-3">Notifications</h2><ul className="mt-3 space-y-3">{activities.slice(0, 3).map((activity) => <li key={activity.id} className="med-body">{activity.text}<p className="med-caption mt-1 text-ink-400">{activity.time}</p></li>)}</ul><button type="button" onClick={() => setNotifications(false)} className="mt-3 text-brand-600">Close</button></section>}</div><Link to="/candidate/profile" className="flex items-center gap-3"><img src={candidate.photo} alt="" className="h-9 w-9 rounded-full object-cover" /><span className="med-body hidden font-semibold md:block">{candidate.firstName} {candidate.lastName}</span><span className="sr-only md:hidden">My Profile</span></Link></div>
  </header>
}
