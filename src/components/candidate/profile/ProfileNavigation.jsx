import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../ui/Button'
import { PROFILE_SETUP_STEPS } from '../../../lib/candidateProfileOptions'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'

export default function ProfileNavigation({ step, busy = false, onSkip }) {
  const navigate = useNavigate()
  const { completeProfile } = useCandidateProfile()
  const current = PROFILE_SETUP_STEPS.find((item) => item.step === step) || PROFILE_SETUP_STEPS[0]
  const previous = step > 1 ? PROFILE_SETUP_STEPS[step - 2] : null
  const showSkip = step > 1 && step < 9
  const skipTarget = onSkip || (() => {
    if (step === 8) completeProfile()
    navigate(current.skipTo || current.path)
  })

  return <footer className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-12">
    <p className="text-[11px] text-ink-400">Your profile is private until you publish it.</p>
    <div className="ml-auto flex gap-2">
      {previous && <Button type="button" variant="secondary" disabled={busy} onClick={() => navigate(previous.path)}>Back</Button>}
      {showSkip && <Button type="button" variant="secondary" disabled={busy} onClick={skipTarget}>Skip</Button>}
      <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : step === 8 ? 'Complete Profile' : 'Next'}</Button>
    </div>
  </footer>
}
