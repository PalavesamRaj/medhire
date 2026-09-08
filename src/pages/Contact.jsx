import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, User, Briefcase, Building2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/FormControls'

const contactCards = [
  {
    icon: User,
    title: 'Candidate Support',
    desc: 'For questions about your profile verification, uploading board certificates, or matching with hospital vacancies.',
    email: 'candidates@medhire.com',
    meta: 'RESPONSE TIME: WITHIN 24 HOURS',
  },
  {
    icon: Briefcase,
    title: 'Recruiter Support',
    desc: 'For questions about candidate unmasking, purchasing credit packs, compliance screening, and recruiter team seats.',
    email: 'recruiters@medhire.com',
    meta: 'RESPONSE TIME: WITHIN 12 HOURS',
  },
  {
    icon: Building2,
    title: 'Business Enquiries',
    desc: 'For hospital networks, enterprise plans, registry API access, partnerships, or media enquiries.',
    email: 'business@medhire.com',
    meta: 'PHONE: +91 98765 43210',
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    subject: '',
    message: '',
  })

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Wire up to your backend / email service here.
    console.log('Contact form submitted:', form)
  }

  return (
    <>
      <section className="container-page py-20 text-center">
        <Badge tone="teal" className="mb-4">Contact MedHire</Badge>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold text-ink-900 sm:text-5xl">
          We're Here to Help
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink-600">
          Have a question about MedHire? Reach out to our team and we'll get back to you within
          24 hours.
        </p>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-ink-900">Send us a Message</h2>
            <p className="mt-1 text-sm text-ink-500">
              Please fill out the form below and we will route your inquiry to the correct
              specialist.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
              <Field label="Full Name">
                <Input
                  placeholder="Dr. Sarah Jenkins"
                  value={form.name}
                  onChange={update('name')}
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email Address">
                  <Input
                    type="email"
                    placeholder="sarah.jenkins@hospital.org"
                    value={form.email}
                    onChange={update('email')}
                    required
                  />
                </Field>
                <Field label="Phone Number">
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                </Field>
              </div>

              <Field label="I am a:">
                <Select value={form.type} onChange={update('type')}>
                  <option value="">Select candidate or recruiter profile type</option>
                  <option value="candidate">Healthcare Professional (Candidate)</option>
                  <option value="recruiter">Hospital / Recruiter</option>
                  <option value="other">Other</option>
                </Select>
              </Field>

              <Field label="Subject">
                <Input
                  placeholder="Inquiry regarding credential checking integration"
                  value={form.subject}
                  onChange={update('subject')}
                  required
                />
              </Field>

              <Field label="Message">
                <textarea
                  rows={5}
                  placeholder="Tell us how we can help you..."
                  value={form.message}
                  onChange={update('message')}
                  className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
                  required
                />
              </Field>

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" icon={ArrowRight}>
                  Send Message
                </Button>
                <p className="text-xs text-ink-400">
                  By submitting you agree to our confidential HIPAA guidelines.
                </p>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-5">
            {contactCards.map((c) => (
              <div key={c.title} className="rounded-xl border border-ink-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-ink-900">{c.title}</p>
                <p className="mt-2 text-sm text-ink-600">{c.desc}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="mt-3 block text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  {c.email}
                </a>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                  {c.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-50/60 py-16 text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-ink-900">Looking for Quick Answers?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-600">
            Check our comprehensive FAQ section for instant answers to common questions about
            credentials, credit packs, and clinical security.
          </p>
          <Link to="/faq">
            <Button variant="secondary" className="mt-6">
              Browse FAQ
            </Button>
          </Link>
        </div>
      </section>

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
            <Button size="lg" variant="secondary">Create Your Profile</Button>
            <Button size="lg" variant="outline">Start Hiring</Button>
          </div>
        </div>
      </section>
    </>
  )
}
