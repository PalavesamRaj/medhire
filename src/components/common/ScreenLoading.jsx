import React from 'react'
import { LoaderCircle } from 'lucide-react'
import Logo from '../layout/Logo'

export default function ScreenLoading() {
  return <main role="status" aria-label="Opening MedHire" className="grid min-h-screen place-items-center bg-ink-50 px-6">
    <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm">
      <div className="flex justify-center"><Logo /></div>
      <div className="mt-8 flex justify-center"><span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600"><LoaderCircle className="size-7 animate-spin" /></span></div>
      <h1 className="mt-4 text-base font-bold text-ink-900">Opening your MedHire workspace</h1>
      <p className="mt-1 text-sm text-ink-600">Preparing your screen…</p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" /></div>
    </div>
  </main>
}
