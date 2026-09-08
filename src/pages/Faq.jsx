import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Accordion } from '../components/ui/DataDisplay'

const faqData = {
  General: [
    {
      q: 'What is MedHire?',
      a: 'MedHire is a dedicated healthcare recruitment marketplace that connects verified healthcare professionals with hospitals and recruiters. Unlike generic job boards, MedHire is purpose-built for the healthcare industry with credential verification and privacy protection.',
    },
    {
      q: 'Who can use MedHire?',
      a: 'Any licensed healthcare professional seeking clinical opportunities, and any verified hospital, clinic, or recruitment agency looking to hire qualified clinical staff.',
    },
    {
      q: 'Is MedHire free to use?',
      a: 'Creating a candidate profile is always free. Recruiters purchase credit packs to unlock full candidate details — you only pay for the profiles you actually unlock.',
    },
  ],
  Candidates: [
    {
      q: 'How do I register as a healthcare professional?',
      a: 'Click Create Your Profile and complete the registration form with your basic information, healthcare specialty, and qualifications. Email verification is required to activate your account.',
    },
    {
      q: 'What information do I need to complete my profile?',
      a: 'You will need your healthcare specialty, board certifications, years of experience, current location, resume, and any active state license or registry IDs.',
    },
    {
      q: 'How does the resume upload work?',
      a: 'Upload a PDF or DOCX resume up to 10MB. It is stored encrypted and only released to a recruiter once they use a credit to unlock your profile.',
    },
    {
      q: 'How long does profile approval take?',
      a: 'Most profiles are reviewed and approved within 24-48 hours once all required certifications and licenses are submitted.',
    },
  ],
  Recruiters: [
    {
      q: 'How does recruiter verification work?',
      a: 'When you register as a recruiter, our team verifies your organization against hospital registries and business databases. This ensures only legitimate healthcare employers access candidate data.',
    },
    {
      q: 'How do I search for candidates?',
      a: 'Use advanced filters for specialty, certification, license state, years of experience, and location to narrow the marketplace down to the exact clinical profile you need.',
    },
    {
      q: 'What do I see before unlocking a candidate?',
      a: 'You see masked preview information: specialty, years of experience, certification types, and a city-level location — full identity and contact details stay hidden until unlock.',
    },
  ],
  'Resume & Privacy': [
    {
      q: 'How is my personal information protected?',
      a: 'All protected information (full name, phone, email, resume, and registry IDs) is encrypted at rest and in transit, and only released to a recruiter after a credit-based unlock.',
    },
    {
      q: 'Can I control who sees my profile?',
      a: 'Yes. You can toggle your visibility, restrict specific hospital domains, or pause active matching at any time from your profile settings.',
    },
    {
      q: 'What happens when a recruiter unlocks my profile?',
      a: 'You are notified immediately of which organization unlocked your profile. The recruiter then gains access to your full name, contact details, and resume.',
    },
  ],
  'Payments & Credits': [
    {
      q: 'What are credits and how do they work?',
      a: 'Credits are used by recruiters to unlock full, unmasked candidate profiles, detailed resumes, and clinical verification reports. You only pay for talent you unlock.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept all major credit and debit cards, along with UPI and net banking for organizations billed in India.',
    },
    {
      q: 'Can I get a refund on unused credits?',
      a: 'Credits are generally non-refundable, except in documented instances of a verified technical system error, per our Terms of Service.',
    },
  ],
  'Account & Security': [
    {
      q: 'How do I reset my password?',
      a: 'Use the "Forgot Password" link on the login screen. You will receive a secure reset link at your registered email address.',
    },
    {
      q: 'Is my data secure on MedHire?',
      a: 'Yes. We use TLS encryption in transit, AES-256 encryption at rest, role-based access controls, and regular third-party security audits.',
    },
    {
      q: 'Can I delete my account?',
      a: 'Yes, you can request account deletion at any time from your settings. Data is permanently removed within 30 days, per our Privacy Policy.',
    },
  ],
}

const categories = ['All', ...Object.keys(faqData)]

export default function Faq() {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c = { All: 0 }
    Object.entries(faqData).forEach(([cat, items]) => {
      c[cat] = items.length
      c.All += items.length
    })
    return c
  }, [])

  const visibleSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(faqData)
      .filter(([cat]) => active === 'All' || cat === active)
      .map(([cat, items]) => [
        cat,
        q ? items.filter((i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) : items,
      ])
      .filter(([, items]) => items.length > 0)
  }, [active, query])

  return (
    <>
      <section className="container-page py-20 text-center">
        <Badge tone="teal" className="mb-4">Support Center</Badge>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold text-ink-900 sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink-600">
          Find answers to common questions about MedHire, our platform, and how healthcare
          recruitment works.
        </p>

        <div className="relative mx-auto mt-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for answers..."
            className="w-full rounded-lg border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          />
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors
                ${active === cat
                  ? 'border-accent-200 bg-accent-50 text-accent-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}
            >
              {cat}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold
                  ${active === cat ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-500'}`}
              >
                {counts[cat]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/60 py-16">
        <div className="container-page mx-auto max-w-3xl">
          {visibleSections.length === 0 && (
            <p className="text-center text-sm text-ink-500">
              No results for “{query}”. Try a different search term.
            </p>
          )}

          <div className="flex flex-col gap-10">
            {visibleSections.map(([cat, items]) => (
              <div key={cat}>
                <h2 className="border-b border-ink-200 pb-3 text-lg font-bold text-ink-900">
                  {cat}
                </h2>
                <div className="mt-4">
                  <Accordion items={items} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-900">
        <div className="container-page py-20 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Still Need Help?</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Can't find the answer you're looking for? Our support team is ready to assist.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact">
              <Button size="lg" variant="secondary">Contact Support</Button>
            </Link>
            <a href="mailto:support@medhire.com">
              <Button size="lg" variant="outline">Email Us</Button>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
