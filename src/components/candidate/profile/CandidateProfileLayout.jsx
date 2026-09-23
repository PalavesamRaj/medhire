import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../layout/Logo'
import ProfileProgress from './ProfileProgress'
import ProfileSidePanel from './ProfileSidePanel'
import ProfileNavigation from './ProfileNavigation'
import { profileSteps } from '../../../lib/candidateProfileOptions'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'

export default function CandidateProfileLayout({ step, children, onSubmit, busy, error }) {
  const { storageError } = useCandidateProfile()
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [step])
  return <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,820fr)_minmax(0,620fr)]">
    <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-14 xl:px-[72px]">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col">
        <Link to="/" className="w-fit" aria-label="MedHire home"><Logo /></Link>
        <ProfileProgress step={step} />
        <header className={`mb-6 ${step === 9 ? 'text-center' : ''}`}><h1 ref={heading} tabIndex={-1} className="text-2xl font-extrabold tracking-tight text-ink-900 outline-none">{profileSteps[step - 1][1]}</h1><p className="mt-1.5 text-sm text-ink-600">{profileSteps[step - 1][2]}</p></header>
        {storageError && <p role="status" className="mb-4 text-sm text-amber-700">{storageError}</p>}
        {step === 9 ? children : <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col">
          <div className="space-y-5">{children}</div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <ProfileNavigation step={step} busy={busy} />
        </form>}
      </div>
    </section>
    <ProfileSidePanel step={step} />
  </main>
}
