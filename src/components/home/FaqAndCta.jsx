import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import { Accordion } from '../ui/DataDisplay'
import Button from '../ui/Button'

const faqs = [
  {
    q: 'How does the candidate verification process work?',
    a: 'Our operations team runs direct checks against various State Medical Registries and credential databases. Once cleared, candidate profiles receive a green "Verified" badge.',
  },
  {
    q: 'What are credits and how do they work?',
    a: 'Credits are used by recruiters to unlock full, unmasked candidate profiles, detailed resumes, and clinical verification reports. You only pay for talent you unlock.',
  },
  {
    q: 'Is my personal information safe on MedHire?',
    a: 'Yes. Contact details and resumes stay locked behind state security checks until a recruiter uses a credit to unlock your profile, and you can pause visibility at any time.',
  },
  {
    q: 'How long does profile approval take?',
    a: 'Most profiles are reviewed and approved within 24-48 hours once all required certifications and licenses are submitted.',
  },
  {
    q: 'Can I use MedHire for both permanent and contract positions?',
    a: 'Yes. Hospitals and recruiters can post both permanent and contract roles, and candidates can filter searches by employment type.',
  },
  {
    q: 'What healthcare specialties are covered?',
    a: 'MedHire covers 120+ healthcare roles, from physicians and nurses to pharmacists, lab technicians, and hospital administrators.',
  },
]

export function Faq() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Help"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about credentials, credits, and clinical recruitment security."
      />
      <div className="mx-auto mt-12 max-w-2xl">
        <Accordion items={faqs} />
        <div className="mt-8 text-center">
          <Link to="/faq">
            <Button variant="secondary" icon={ArrowRight}>
              View All FAQs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function CtaBand() {
  return (
    <section className="bg-brand-900">
      <div className="container-page py-20 text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Ready to Transform Healthcare Hiring?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-100">
          Join thousands of pre-screened medical professionals and top hospital HR directors
          already matching on MedHire.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/get-started">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Button size="lg" variant="outline">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
