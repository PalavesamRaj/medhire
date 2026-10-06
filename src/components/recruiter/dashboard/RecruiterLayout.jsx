import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import RecruiterHeader from './RecruiterHeader'
import RecruiterSidebar from './RecruiterSidebar'

export default function RecruiterLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const main = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    main.current?.focus()
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#recruiter-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3">
        Skip to content
      </a>
      <RecruiterHeader menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <div className="lg:flex">
        <RecruiterSidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main id="recruiter-content" ref={main} tabIndex={-1} className="min-w-0 flex-1 p-5 outline-none sm:p-7">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}