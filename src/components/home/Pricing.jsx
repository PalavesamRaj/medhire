import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'

const plans = [
  {
    tier: 'Starter',
    price: '₹4,999',
    desc: 'Best for individual specialty clinics',
    features: [
      '10 Candidate Unlocks / Credits',
      'Basic Search Filters',
      'Email support (24hr response)',
      'Export to basic CSV data format',
    ],
    cta: 'Choose Starter',
    to: '/register/recruiter',
    variant: 'secondary',
  },
  {
    tier: 'Professional',
    price: '₹14,999',
    desc: 'Optimized for mid-scale general hospitals',
    features: [
      '50 Candidate Unlocks / Credits',
      'Advanced specialty & registry filters',
      'Priority direct line support (2hr response)',
      'Candidate analytics reporting dashboard',
      'Compliance tracking documentation panel',
    ],
    cta: 'Choose Professional',
    to: '/register/recruiter',
    variant: 'secondary',
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    desc: 'For national multi-facility medical networks',
    features: [
      'Unlimited candidate unlocks',
      'Custom registry API connections',
      'Dedicated compliance account advisor',
      'HIPAA compliant custom dashboard integration',
      'Enterprise SLA framework protections',
    ],
    cta: 'Contact Sales',
    to: '/contact',
    variant: 'secondary',
  },
]

export default function Pricing() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Pricing Plan"
        title="Simple, Transparent Pricing for Recruiters"
        subtitle="Direct credit-based structures to suit every medical hiring scale."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.tier}
            className="group flex flex-col rounded-xl border border-ink-200 bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-brand-600 hover:shadow-lg hover:ring-1 hover:ring-brand-600 focus-within:-translate-y-1 focus-within:border-brand-600 focus-within:shadow-lg focus-within:ring-1 focus-within:ring-brand-600"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {p.tier}
              </p>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-ink-900">
              {p.price}
              {p.price !== 'Custom' && <span className="text-base font-medium text-ink-400">/mo</span>}
            </p>
            <p className="mt-1 text-sm text-ink-500">{p.desc}</p>

            <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-ink-100 pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  {f}
                </li>
              ))}
            </ul>

            <Link to={p.to} className="mt-6">
              <Button variant={p.variant} className="w-full justify-center transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white group-focus-within:border-brand-600 group-focus-within:bg-brand-600 group-focus-within:text-white">
                {p.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
