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
    variant: 'primary',
    featured: true,
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
            className={`flex flex-col rounded-xl border bg-white p-7 ${
              p.featured ? 'border-brand-600 shadow-lg ring-1 ring-brand-600' : 'border-ink-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {p.tier}
              </p>
              {p.featured && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  Most Popular
                </span>
              )}
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
              <Button variant={p.variant} className="w-full justify-center">
                {p.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
