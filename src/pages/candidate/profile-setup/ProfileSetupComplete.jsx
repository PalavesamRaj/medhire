import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Info } from 'lucide-react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import Button from '../../../components/ui/Button'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { profilePath } from '../../../lib/candidateProfileOptions'
import { getCandidateProfileCompletion } from '../../../lib/candidateProfileCompletion'
import { Link } from 'react-router-dom'

export default function ProfileSetupComplete() {
  const { submitted, profile, loading } = useCandidateProfile()
  const navigate = useNavigate()
  const completion = getCandidateProfileCompletion(profile)
  if (loading) return <CandidateProfileLayout step={9}><p className="text-center text-sm text-ink-600">Checking your saved profile…</p></CandidateProfileLayout>
  if (!submitted) return <Navigate to={profilePath(1)} replace />
  return <CandidateProfileLayout step={9}>
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckCircle2 size={32} /></div>
      <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
        <div className="mb-4 flex justify-between text-sm font-semibold"><span>Profile strength</span><span className="text-brand-600">{completion.percentage}%</span></div>
        <div role="progressbar" aria-label="Profile strength" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage} className="mb-5 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-green-600" style={{ width: `${completion.percentage}%` }} /></div>
        <ul className="space-y-3">{completion.sections.map((section) => {
          const status = section.complete ? 'Complete' : section.optional ? 'Not provided (optional)' : 'Needs attention'
          return <li key={section.key} className="flex items-center justify-between gap-3 text-sm text-ink-900"><span className="flex items-center gap-2">{section.complete ? <CheckCircle2 size={17} className="shrink-0 text-green-600" /> : <Circle size={17} className="shrink-0 text-ink-400" />}{section.label}<span className="text-xs text-ink-600">— {status}</span></span>{!section.complete && <Link className="shrink-0 text-xs font-semibold text-brand-600 hover:underline" to={section.path}>Edit</Link>}</li>
        })}</ul>
      </div>
      <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700"><Info size={16} className="shrink-0" />Onboarding is complete. Profile strength reflects completed required sections; work experience is counted for candidates with more than one year of experience. Certifications are optional.</p>
      <div className="text-center"><Button onClick={() => navigate('/candidate/dashboard')} className="min-w-[240px]">Go to Dashboard</Button></div>
    </div>
  </CandidateProfileLayout>
}
