import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CandidateHeader from './CandidateHeader'
import CandidateSidebar from './CandidateSidebar'

export default function CandidateLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const main = useRef(null)
  useEffect(() => { setMenuOpen(false); main.current?.focus() }, [pathname])
  return <div className="candidate-app med-body min-h-screen bg-ink-50 text-ink-900">
    <a href="#candidate-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to content</a>
    <CandidateHeader menuOpen={menuOpen} onToggleMenu={() => setMenuOpen(!menuOpen)} />
    <div className="lg:flex"><CandidateSidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} /><main id="candidate-content" ref={main} tabIndex={-1} className="min-w-0 flex-1 px-4 py-7 outline-none sm:px-7 lg:px-8"><div className="mx-auto max-w-[1440px] space-y-6"><Outlet /></div></main></div>
  </div>
}
