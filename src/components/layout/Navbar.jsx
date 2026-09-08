import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import Button from '../ui/Button'

const links = [
  { to: '/', label: 'Home' },
  { to: '/find-jobs', label: 'Find Jobs' },
  { to: '/for-recruiters', label: 'For Recruiters' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white shadow-sm">
      <div className="container-page flex h-16 items-center justify-between">
        <NavLink to="/">
          <Logo />
        </NavLink>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-ink-600 hover:text-ink-900'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="text-sm font-semibold text-ink-900 hover:text-brand-600">
            Login
          </Link>
          <Link to="/get-started">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink-600"
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-900">
                Login
              </Link>
              <Link to="/get-started" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full justify-center">Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
