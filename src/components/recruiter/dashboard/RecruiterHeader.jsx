import React, { useState } from 'react'
import { Bell, LogOut, Menu, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../layout/Logo'
import { clearAuthSession, getAuthenticatedUser } from '../../../lib/authSession'

export default function RecruiterHeader({ menuOpen, onToggleMenu }) {
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navigate = useNavigate()
  const user = getAuthenticatedUser()
  const initials = (user?.fullName || user?.email || 'R').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'R'

  const handleSearch = (event) => {
    event.preventDefault()
    navigate(`/recruiter/find-candidates?search=${encodeURIComponent(query.trim())}`)
  }

  const handleSignOut = () => {
    clearAuthSession()
    navigate('/login?role=recruiter')
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/recruiter/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      <form onSubmit={handleSearch} role="search" className="order-3 w-full sm:order-none sm:w-96">
        <label className="relative block">
          <span className="sr-only">Search candidates</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search candidates, specialties..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </form>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="mt-3 text-xs text-slate-500">Notifications will appear here when activity updates are available.</p>
            </div>
          )}
        </div>
        <Link to="/recruiter/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {initials}
          </span>
          <span className="hidden text-xs font-bold text-slate-900 md:block">{user?.fullName || user?.email || 'Recruiter'}</span>
        </Link>
        <button type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"><LogOut className="h-4 w-4" /></button>
      </div>
    </header>
  )
}
