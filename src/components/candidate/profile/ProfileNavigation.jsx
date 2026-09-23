import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../ui/Button'
import { profilePath } from '../../../lib/candidateProfileOptions'

export default function ProfileNavigation({ step, busy = false }) {
  const navigate = useNavigate()
  return <footer className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-12">
    <p className="text-[11px] text-ink-400">Your profile is private until you publish it.</p>
    <div className="ml-auto flex gap-2">{step > 1 && <Button type="button" variant="secondary" disabled={busy} onClick={() => navigate(profilePath(step - 1))}>Back</Button>}<Button type="submit" disabled={busy}>{busy ? 'Submitting…' : step === 8 ? 'Complete Profile' : 'Next'}</Button></div>
  </footer>
}
