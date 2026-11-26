import React from 'react'

function Block({ className = '' }) {
  return <div className={`animate-pulse rounded bg-ink-100 ${className}`} />
}

export function CandidateDashboardSkeleton() {
  return <div className="flex flex-col gap-5" aria-label="Loading candidate dashboard" aria-busy="true">
    <div className="space-y-2"><Block className="h-8 w-64 max-w-full" /><Block className="h-4 w-80 max-w-full" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="med-card space-y-4"><Block className="h-4 w-28" /><Block className="h-9 w-16" /><Block className="h-4 w-20" /></div>)}</div>
    <div className="grid items-start gap-4 xl:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="med-card space-y-3"><Block className="h-5 w-40" /><Block className="h-4 w-full" /><Block className="h-4 w-2/3" /></div>)}</div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]"><section className="space-y-3"><Block className="h-6 w-44" /><div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="med-card space-y-3"><Block className="h-5 w-3/4" /><Block className="h-4 w-full" /><Block className="h-4 w-1/2" /></div>)}</div></section><div className="med-card space-y-4"><Block className="h-6 w-36" />{Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-2"><Block className="h-4 w-full" /><Block className="h-3 w-2/3" /></div>)}</div></div>
  </div>
}

export default function CandidateRouteSkeleton({ pathname = '' }) {
  if (pathname === '/candidate/dashboard') return <CandidateDashboardSkeleton />
  const isList = pathname.includes('/jobs') || pathname.endsWith('/applications') || pathname.endsWith('/saved-jobs') || pathname.endsWith('/resume-management')
  return <div className="flex animate-pulse flex-col gap-5" aria-label="Loading candidate page" aria-busy="true">
    <div className="space-y-2"><Block className="h-8 w-56 max-w-full" /><Block className="h-4 w-80 max-w-full" /></div>
    {isList && <div className="grid gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-10 w-full rounded-lg" />)}</div>}
    <div className={isList ? 'flex flex-col gap-3' : 'grid gap-4 lg:grid-cols-2'}>{Array.from({ length: isList ? 6 : 4 }, (_, index) => <div key={index} className="med-card space-y-4"><Block className="h-5 w-2/3" /><Block className="h-4 w-full" /><Block className="h-4 w-5/6" />{!isList && <Block className="h-10 w-32 rounded-lg" />}</div>)}</div>
  </div>
}
