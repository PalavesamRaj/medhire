import NotificationBell from '../../common/NotificationBell'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LogOut } from 'lucide-react'
import CandidateIcon, { candidateAsset } from './CandidateIcon'
import { useCandidateDashboard } from '../../../context/CandidateDashboardContext'
import JobSearchInput from './JobSearchInput'
import { logout } from '../../../lib/http'

export default function CandidateHeader({ menuOpen, onToggleMenu }) {
  const { candidate, activities } = useCandidateDashboard()
  const [query, setQuery] = useState('')
  const [notifications, setNotifications] = useState(false)
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate('/login?role=candidate', { replace: true }) }
  return <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-ink-200 bg-white px-4 py-3 sm:px-7">
    <div className="flex items-center gap-3"><button type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="candidate-navigation" onClick={onToggleMenu} className="rounded-lg p-2 text-ink-600 hover:bg-ink-50 lg:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><Link to="/candidate/dashboard" className="flex items-center gap-2"><span className="rounded-md bg-accent-50 p-1.5"><img src={candidateAsset('stethoscope')} alt="" className="h-5 w-5" /></span><span className="med-heading-2 font-bold">MedHire</span></Link></div>
    <form role="search" aria-label="Global job search" onSubmit={(event) => { event.preventDefault(); navigate(`/candidate/jobs?q=${encodeURIComponent(query.trim())}`); setNotifications(false) }} className="relative order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-md"><JobSearchInput label="Search jobs, hospitals, specialties" placeholder="Search jobs, hospitals, specialties…" value={query} onChange={setQuery} className="bg-ink-50" /></form>
    <div className="flex items-center gap-3"><NotificationBell /><Link to="/candidate/profile" className="flex items-center gap-3">{candidate.photo && <img src={candidate.photo} alt="" className="h-9 w-9 rounded-full object-cover" />}<span className="med-body hidden font-semibold md:block">{candidate.firstName} {candidate.lastName}</span><span className="sr-only md:hidden">My Profile</span></Link><button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50 hover:text-ink-900"><LogOut size={18} /></button></div>
  </header>
}
