import React from 'react'
import SectionHeading from '../ui/SectionHeading'
import { Avatar } from '../ui/DataDisplay'

const reviews = [
  {
    quote:
      'Using MedHire, I was placed at a top research hospital within ten days. The credential verification process was highly secure, and my private details remained protected.',
    name: 'Dr. Sarah Jenkins',
    role: 'Anesthesiologist — Mayo Clinic',
  },
  {
    quote:
      'Finding nursing candidates with valid active registry licenses used to take us weeks. With MedHire, we filter, verify, and connect in under two hours. Phenomenal tool.',
    name: 'Melissa Hunter',
    role: 'HR Director — Apollo Health Networks',
  },
  {
    quote:
      'The credit-based matching model is brilliant for small clinics. We only unlocked the direct details of candidates we were fully aligned to hire. Highly recommended.',
    name: 'James Torres, RN',
    role: 'Clinic Administrator — Apex Clinical Care',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-ink-50/60 py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Reviews"
          title="What Our Users Say"
          subtitle="Clinical managers and doctors review their MedHire experiences."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-xl border border-ink-200 bg-white p-6">
              <p className="text-sm leading-relaxed text-ink-700">“{r.quote}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                <Avatar name={r.name} size={36} />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{r.name}</p>
                  <p className="text-xs text-ink-400">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
