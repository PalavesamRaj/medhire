import React from 'react'
import { User, Building2 } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const candidateSteps = [
  { title: 'Create Your Profile', desc: 'Register and build your professional healthcare profile with credentials, specialty licenses, and historical clinical experience.' },
  { title: 'Get Verified', desc: 'Our rigorous compliance team reviews your certifications and registry licenses for complete quality and clinical safety assurance.' },
  { title: 'Get Discovered', desc: 'Approved profiles enter the marketplace. Verified hospital recruiters browse and initiate direct connections.' },
]

const recruiterSteps = [
  { title: 'Search Candidates', desc: 'Browse our extensive pool of verified healthcare clinicians using deep filter criteria for certifications and licenses.' },
  { title: 'Unlock Profiles', desc: 'Utilize system credits to securely access complete unmasked resumes, credentials records, and immediate contact details.' },
  { title: 'Hire With Confidence', desc: 'Reach out directly through premium integrated communication channels to proceed with direct placement.' },
]

function StepList({ steps }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {steps.map((s, i) => (
        <div key={s.title} className="rounded-xl border border-ink-200 bg-white p-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-xs font-bold text-accent-700">
            {i + 1}
          </span>
          <p className="mt-3 font-semibold text-ink-900">{s.title}</p>
          <p className="mt-1.5 text-sm text-ink-600">{s.desc}</p>
        </div>
      ))}
    </div>
  )
}

export default function ProcessSection() {
  return (
    <section className="bg-ink-50/60 py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Process"
          title="How MedHire Works"
          subtitle="A simplified, secure methodology designed for direct medical matching with complete institutional trust."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-ink-600" />
              <h3 className="font-semibold text-ink-900">For Candidates</h3>
            </div>
            <StepList steps={candidateSteps} />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-ink-600" />
              <h3 className="font-semibold text-ink-900">For Recruiters</h3>
            </div>
            <StepList steps={recruiterSteps} />
          </div>
        </div>
      </div>
    </section>
  )
}
