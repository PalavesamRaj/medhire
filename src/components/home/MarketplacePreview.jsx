import React from 'react'
import { Lock } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const candidates = [
  {
    name: 'Dr. S···· K····',
    role: 'Cardiologist (MD)',
    experience: '8 years',
    location: 'Cleveland, OH',
    phone: '•••• •• 42',
    email: 's····@····.com',
    credits: 3,
  },
  {
    name: 'Michael T····, RN',
    role: 'ICU Specialist Nurse',
    experience: '5 years',
    location: 'Austin, TX',
    phone: '•••• •• 89',
    email: 'm····@····.org',
    credits: 2,
  },
  {
    name: 'Sarah J····, NP',
    role: 'Pediatric Nurse Practitioner',
    experience: '12 years',
    location: 'Seattle, WA',
    phone: '•••• •• 11',
    email: 'j····@····.net',
    credits: 2,
  },
]

export default function MarketplacePreview() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Marketplace Preview"
        title="Preview Our Talent Marketplace"
        subtitle="Explore mock samples of how verified candidate profiles display to hospital operators — fully private."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {candidates.map((c) => (
          <div key={c.name} className="rounded-xl border border-ink-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-[10px] font-semibold uppercase text-ink-400">
                Blur
              </div>
              <Badge tone="success">Verified Candidate</Badge>
            </div>

            <p className="mt-4 font-semibold text-ink-900">{c.name}</p>
            <p className="text-sm font-medium text-brand-600">{c.role}</p>

            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-400">Experience:</dt>
                <dd className="font-semibold text-ink-900">{c.experience}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Location:</dt>
                <dd className="font-semibold text-ink-900">{c.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Phone:</dt>
                <dd className="text-ink-300">{c.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Email:</dt>
                <dd className="text-ink-300">{c.email}</dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center gap-1.5 border-t border-ink-100 pt-3 text-xs text-ink-400">
              <Lock className="h-3.5 w-3.5" />
              Resume Locked For Privacy
            </div>

            <Button className="mt-4 w-full justify-center">
              Unlock Profile ({c.credits} credits)
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
