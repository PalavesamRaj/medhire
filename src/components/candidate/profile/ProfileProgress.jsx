import React from 'react'
import { profileSteps } from '../../../lib/candidateProfileOptions'

export default function ProfileProgress({ step }) {
  return <div className="mb-7 mt-7">
    <div className="mb-3 flex items-center justify-between text-[10px] font-semibold"><span className="tracking-widest text-brand-600">PROFILE SETUP</span><span className="text-ink-600">Step {step} of 9</span></div>
    <ol aria-label="Profile setup progress" className="flex items-center">
      {profileSteps.map(([, title], index) => <li key={title} aria-current={index === step - 1 ? 'step' : undefined} className="flex min-w-0 flex-1 items-center last:flex-none">
        <span title={title} className={`block h-1.5 rounded-full ${index === step - 1 ? 'w-5 bg-brand-600' : index < step ? 'w-1.5 bg-brand-600' : 'w-1.5 bg-ink-200'}`}><span className="sr-only">{title}{index < step - 1 ? ', completed' : ''}</span></span>
        {index < 8 && <span className={`mx-1 h-px flex-1 ${index < step - 1 ? 'bg-brand-600' : 'bg-ink-200'}`} />}
      </li>)}
    </ol>
  </div>
}
