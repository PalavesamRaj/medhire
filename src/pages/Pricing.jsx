import React, { useState } from 'react'
import { Check, ChevronDown, CircleCheck, CreditCard, FileText, Search, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const plans = [
  {
    name: 'Starter',
    description: 'For small hospitals and independent recruiters.',
    price: '₹4,999',
    period: '/ 30 days · DEMO price',
    features: ['25 candidate unlock credits', '3 active job postings', '1 recruiter seat', '30-day plan validity'],
    cta: 'Choose Starter',
    to: '/register/recruiter',
  },
  {
    name: 'Professional',
    description: 'For growing hospital recruitment teams.',
    price: '₹14,999',
    period: '/ 90 days · DEMO price',
    features: ['100 candidate unlock credits', '15 active job postings', '5 recruiter seats', '90-day plan validity', 'Priority candidate alerts'],
    cta: 'Choose Professional',
    to: '/register/recruiter',
    featured: true,
  },
  {
    name: 'Enterprise',
    description: 'For hospital groups and recruitment agencies.',
    price: 'Custom',
    period: 'tailored agreement · DEMO price',
    features: ['Custom candidate unlock credits', 'Custom job posting capacity', 'Custom recruiter seats', 'Dedicated onboarding and support'],
    cta: 'Contact Sales',
    to: '/contact',
  },
]

const comparisonRows = [
  ['Candidate unlock credits', '25', '100', 'Custom'],
  ['Active job postings', '3', '15', 'Custom'],
  ['Recruiter seats', '1', '5', 'Custom'],
  ['Plan validity', '30 days', '90 days', 'Annual / custom'],
  ['Candidate alerts', 'Standard', 'Priority', 'Custom workflows'],
  ['Support', 'Email', 'Priority email', 'Dedicated manager'],
]

const steps = [
  ['Buy Plan', 'Select the plan that matches your hiring volume.', CreditCard],
  ['Receive Credits', 'Credits appear in your recruiter account.', CircleCheck],
  ['Search Candidates', 'Filter approved clinicians by role and location.', Search],
  ['Use Credit to Unlock', 'Unlock one approved profile when ready.', ShieldCheck],
  ['Access Contact & Resume', 'View authorized contact details and resume.', FileText],
]

const faqs = [
  ['What does one candidate unlock credit include?', 'One credit reveals the approved profile’s authorized contact details and available resume documents for the entitled recruiter account.'],
  ['Will I be charged twice for the same candidate?', 'No. The same recruiter account is not charged twice for a candidate already unlocked, subject to active platform entitlement rules.'],
  ['Can unused credits roll over?', 'Credit rollover depends on the plan and its active validity period. Contact sales for a tailored agreement.'],
  ['Can I add recruiter seats later?', 'Yes. Professional and Enterprise plans can be expanded as your recruitment team grows.'],
  ['Are these final prices?', 'These are demo prices for evaluation. Contact sales for current commercial pricing.'],
  ['What is included with Enterprise support?', 'Enterprise includes dedicated onboarding, support, custom capacity, and account-level entitlement guidance.'],
]

function SectionIntro({ eyebrow, title, children }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
      <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-bold leading-10 text-ink-900">{title}</h2>
      <p className="text-base leading-6 text-ink-600">{children}</p>
    </div>
  )
}

function FeatureIcon({ icon: Icon, tone = 'teal' }) {
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone === 'blue' ? 'bg-brand-50 text-brand-600' : 'bg-accent-50 text-accent-600'}`}>
      <Icon className="h-5 w-5" />
    </span>
  )
}

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="bg-ink-50">
      <section className="border-b border-ink-200 bg-white px-6 py-16 lg:px-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            Recruiter Pricing
          </span>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
            Flexible Hiring Plans for Healthcare Recruiters
          </h1>
          <p className="max-w-3xl text-base leading-6 text-ink-600">
            Purchase credits to unlock approved healthcare candidate profiles, access authorized contact details and resumes, and scale hiring with complete cost visibility.
          </p>
        </div>
      </section>

      <section id="plans" className="bg-white px-6 py-20 lg:px-20">
        <SectionIntro eyebrow="Simple plans" title="Choose a Plan That Fits Your Hiring Scale">
          Editable demo pricing for recruiter evaluation. Credits are used only when authorized candidate details are unlocked.
        </SectionIntro>
        <div className="mx-auto mt-12 grid max-w-7xl items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`flex flex-col rounded-xl bg-white p-8 ${plan.featured ? 'border-2 border-brand-600 shadow-lg' : 'border border-ink-200 shadow-sm'}`}>
              {plan.featured && <span className="mb-5 self-start rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-600">Most Popular</span>}
              <h3 className="text-xl font-bold text-ink-900">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-ink-600">{plan.description}</p>
              <div className="mt-5">
                <p className="text-3xl font-extrabold text-ink-900">{plan.price}</p>
                <p className="mt-1 text-xs text-ink-400">{plan.period}</p>
              </div>
              <div className="my-5 border-t border-ink-200" />
              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-ink-600">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.featured ? 'bg-brand-50 text-brand-600' : 'bg-accent-50 text-accent-600'}`}><Check className="h-3.5 w-3.5" /></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to={plan.to} className="mt-7">
                <Button variant={plan.featured ? 'primary' : 'secondary'} className="w-full justify-center">{plan.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-200 bg-ink-50 px-6 py-14 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Current plan / credit concept</p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900">Professional plan</h2>
            <p className="mt-2 text-sm text-ink-600">Active until 18 Dec 2026 · 4 of 5 recruiter seats in use</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold text-ink-600">Candidate credits</p><p className="mt-1 text-3xl font-extrabold text-ink-900">72 / 100</p><p className="mt-1 text-xs text-green-600">28 profiles unlocked</p></div>
            <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold text-ink-600">Active job postings</p><p className="mt-1 text-3xl font-extrabold text-ink-900">9 / 15</p><p className="mt-1 text-xs text-ink-600">6 slots available</p></div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 lg:px-20">
        <SectionIntro eyebrow="Transparent credit model" title="How Credits Work">A clear five-step path from plan purchase to authorized candidate access.</SectionIntro>
        <div className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-3 lg:grid-cols-5">
          {steps.map(([title, description, Icon], index) => (
            <div key={title} className="rounded-xl border border-ink-200 bg-ink-50 p-5">
              <div className="flex items-center justify-between"><FeatureIcon icon={Icon} tone="blue" /><span className="font-mono text-xs font-bold text-ink-400">0{index + 1}</span></div>
              <h3 className="mt-4 text-base font-bold text-ink-900">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-ink-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-6 flex max-w-7xl items-start gap-3 rounded-lg border border-teal-100 bg-teal-50 p-5 text-sm leading-5 text-teal-700"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> The same recruiter account is not charged twice for a candidate already unlocked, subject to the platform’s active entitlement rules.</div>
      </section>

      <section className="bg-ink-50 px-6 py-20 lg:px-20">
        <SectionIntro eyebrow="Compare plans" title="Plan Comparison">Review the included capacity and service level across every recruiter plan.</SectionIntro>
        <div className="mx-auto mt-11 max-w-7xl overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-sm">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] bg-ink-900 p-4 text-sm font-bold text-white"><span>Feature</span><span className="text-center">Starter</span><span className="text-center">Professional</span><span className="text-center">Enterprise</span></div>
            {comparisonRows.map((row, index) => <div key={row[0]} className={`grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-ink-200 p-4 text-sm ${index % 2 ? 'bg-ink-50' : 'bg-white'}`}><span className="font-semibold text-ink-900">{row[0]}</span>{row.slice(1).map((value) => <span key={value} className="text-center text-ink-600">{value}</span>)}</div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 lg:px-20">
        <SectionIntro eyebrow="Built for recruiting teams" title="Benefits of Upgrading">Unlock more throughput without compromising candidate privacy or recruiter accountability.</SectionIntro>
        <div className="mx-auto mt-11 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[['Move faster', 'Give every approved recruiter the credits and tools to contact qualified clinicians.', Users], ['Control costs', 'Replace opaque placement fees with a transparent, trackable credit balance.', CreditCard], ['Collaborate securely', 'Add recruiter seats while preserving account-level access and entitlement controls.', ShieldCheck], ['Scale confidently', 'Increase unlocks, postings, validity and support as hiring demand grows.', Search]].map(([title, description, Icon]) => <div key={title} className="rounded-xl border border-ink-200 bg-ink-50 p-7"><FeatureIcon icon={Icon} tone="blue" /><h3 className="mt-4 text-lg font-bold text-ink-900">{title}</h3><p className="mt-2 text-sm leading-5 text-ink-600">{description}</p></div>)}
        </div>
        <div className="mx-auto mt-6 grid max-w-7xl gap-4 rounded-xl border border-teal-100 bg-teal-50 p-7 text-sm text-ink-600 sm:grid-cols-3">{['Verified healthcare-only talent pool', 'Account-level credit history', 'Authorized contact and resume access'].map((item) => <div key={item} className="flex items-center gap-2.5"><Check className="h-4 w-4 text-teal-600" />{item}</div>)}</div>
      </section>

      <section className="bg-ink-50 px-6 py-20 lg:px-20">
        <SectionIntro eyebrow="Pricing help" title="Pricing FAQ">Answers about credits, account entitlement, team seats and plan flexibility.</SectionIntro>
        <div className="mx-auto mt-11 flex max-w-3xl flex-col gap-3.5">
          {faqs.map(([question, answer], index) => <div key={question} className="rounded-xl border border-ink-200 bg-white p-5"><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 text-left"><span className="text-base font-semibold text-ink-900">{question}</span>{openFaq === index ? <span className="text-lg text-ink-600">−</span> : <ChevronDown className="h-5 w-5 text-ink-600" />}</button>{openFaq === index && <p className="mt-3 text-sm leading-5 text-ink-600">{answer}</p>}</div>)}
        </div>
      </section>

      <section className="bg-brand-900 px-6 py-20 text-center lg:px-20">
        <h2 className="text-3xl font-bold leading-10 text-white">Start Hiring Healthcare Talent</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-6 text-white/80">Choose a flexible recruiter plan, receive credits, and connect directly with approved healthcare professionals.</p>
        <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row"><Link to="#plans"><Button className="bg-white text-brand-600 hover:bg-brand-50">Choose a Plan</Button></Link><Link to="/contact"><Button variant="outline">Contact Sales</Button></Link></div>
      </section>
    </div>
  )
}
