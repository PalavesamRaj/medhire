import React from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import NotificationBell from '../../common/NotificationBell'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../layout/Logo'
import { getAuthenticatedUser } from '../../../lib/authSession'
import { logout } from '../../../lib/http'

export default function RecruiterHeader({ menuOpen, onToggleMenu }) {
  const navigate = useNavigate()
  const user = getAuthenticatedUser()
  const initials = (user?.fullName || user?.email || 'R').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'R'

  const handleSignOut = async () => {
    await logout()
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

      <div className="flex items-center gap-3">
        <NotificationBell />
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
