import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../layout/Logo'
import ProfileProgress from './ProfileProgress'
import ProfileSidePanel from './ProfileSidePanel'
import ProfileNavigation from './ProfileNavigation'
import { profileSteps } from '../../../lib/candidateProfileOptions'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'

export default function CandidateProfileLayout({ step, children, onSubmit, busy, submitting, error, onBack, onSkip }) {
  const { storageError, profileError, profile, submitted, loading } = useCandidateProfile()
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [step])
  if (loading) return <main className="min-h-screen animate-pulse bg-white lg:grid lg:grid-cols-[minmax(0,820fr)_minmax(0,620fr)]" aria-label="Loading your profile setup" aria-busy="true">
    <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-14 xl:px-[72px]"><div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col"><Logo /><div className="mt-8 h-3 w-full rounded bg-ink-100" /><div className="mt-8 h-8 w-64 rounded bg-ink-100" /><div className="mt-3 h-4 w-80 max-w-full rounded bg-ink-100" /><div className="mt-8 flex flex-1 flex-col gap-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2"><div className="h-4 w-32 rounded bg-ink-100" /><div className="h-11 w-full rounded-lg bg-ink-100" /></div>)}</div><div className="mt-8 h-11 w-40 rounded-lg bg-ink-100" /></div></section>
    <aside className="hidden bg-ink-50 p-10 lg:block"><div className="mx-auto mt-24 max-w-md space-y-5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 rounded-xl bg-ink-100" />)}</div></aside>
  </main>
  return <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,820fr)_minmax(0,620fr)]">
    <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-14 xl:px-[72px]">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col">
        <Link to="/" className="w-fit" aria-label="MedHire home"><Logo /></Link>
        <ProfileProgress step={step} profile={profile} submitted={submitted} />
        <header className={`mb-6 ${step === 9 ? 'text-center' : ''}`}><h1 ref={heading} tabIndex={-1} className="text-2xl font-extrabold tracking-tight text-ink-900 outline-none">{profileSteps[step - 1][1]}</h1><p className="mt-1.5 text-sm text-ink-600">{profileSteps[step - 1][2]}</p></header>
        {storageError && <p role="status" className="mb-4 text-sm text-amber-700">{storageError}</p>}
        {profileError && <p role="status" className="mb-4 text-sm text-amber-700">{profileError} Your saved draft is shown when available.</p>}
        {step === 9 ? children : <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col">
          <div className="space-y-5">{children}</div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <ProfileNavigation step={step} busy={busy} submitting={submitting} onBack={onBack} onSkip={onSkip} />
        </form>}
      </div>
    </section>
    <ProfileSidePanel step={step} />
  </main>
}
