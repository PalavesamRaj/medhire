import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Info } from 'lucide-react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import Button from '../../../components/ui/Button'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { profileSteps, profilePath } from '../../../lib/candidateProfileOptions'
import { profileSections } from '../../../lib/candidateProfileValidation'

export default function ProfileSetupComplete() {
  const { submitted, profile } = useCandidateProfile()
  const navigate = useNavigate()
  if (!submitted) return <Navigate to={profilePath(1)} replace />
  return <CandidateProfileLayout step={9}>
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckCircle2 size={32} /></div>
      <ul className="space-y-3 rounded-lg border border-ink-200 bg-ink-50 p-5">{profileSteps.slice(0, 8).map(([, title], index) => <li key={title} className="flex items-center gap-2 text-sm text-ink-900"><CheckCircle2 size={17} className="shrink-0 text-green-600" /><span>{title} <span className="text-xs text-ink-600">— {(index === 3 || index === 5) && !profile[profileSections[index]].length ? 'Not provided (optional)' : 'Complete'}</span></span></li>)}</ul>
      <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700"><Info size={16} className="shrink-0" />Your profile and resume have been submitted for review.</p>
      <div className="text-center"><Button onClick={() => navigate('/candidate/dashboard')} className="min-w-[240px]">Go to Dashboard</Button></div>
    </div>
  </CandidateProfileLayout>
}
