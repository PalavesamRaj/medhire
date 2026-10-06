import React from 'react'
import { profileSteps } from '../../../lib/candidateProfileOptions'
import { getCandidateProfileCompletion } from '../../../lib/candidateProfileCompletion'

export default function ProfileProgress({ step, profile, submitted }) {
  const completion = getCandidateProfileCompletion(profile)
  const statusByKey = Object.fromEntries(completion.sections.map((section) => [section.key, section.complete]))
  statusByKey.complete = Boolean(submitted)
  const stepKeys = ['resume', 'personalInformation', 'professionalInformation', 'education', 'workExperience', 'skills', 'certifications', 'careerPreferences', 'complete']
  return <div className="mb-7 mt-7">
    <div className="mb-3 flex items-center justify-between text-[10px] font-semibold"><span className="tracking-widest text-brand-600">PROFILE SETUP</span><span className="text-ink-600">Step {step} of 9</span></div>
    <ol aria-label="Profile setup progress" className="flex items-center">
      {profileSteps.map(([, title], index) => {
        const complete = Boolean(statusByKey[stepKeys[index]])
        const current = index === step - 1
        return <li key={title} aria-current={current ? 'step' : undefined} className="flex min-w-0 flex-1 items-center last:flex-none">
        <span title={title} className={`block h-1.5 rounded-full ${current ? 'w-5 bg-brand-600' : complete ? 'w-1.5 bg-brand-600' : 'w-1.5 bg-ink-200'}`}><span className="sr-only">{title}{complete ? ', complete' : ', incomplete'}</span></span>
        {index < 8 && <span className={`mx-1 h-px flex-1 ${complete ? 'bg-brand-600' : 'bg-ink-200'}`} />}
      </li>})}
    </ol>
  </div>
}
