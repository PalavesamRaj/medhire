import React from 'react'
import { Link } from 'react-router-dom'
import {
  User, Edit3, Upload, ShieldCheck, Check, Search, Users2,
  Building2, Eye, Lock, Download, Briefcase, XCircle, UserCheck, Download as DownloadIcon,
} from 'lucide-react'
import SectionHeading from '../components/ui/SectionHeading'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const candidateSteps = [
  { icon: User, title: 'Register', desc: 'Create your free MedHire account with basic information and email verification.' },
  { icon: Edit3, title: 'Complete Your Profile', desc: 'Add your healthcare specialty, certifications, qualifications, work experience, and preferences.' },
  { icon: Upload, title: 'Upload Your Resume', desc: 'Attach your professional resume and supporting documents securely.' },
  { icon: ShieldCheck, title: 'Admin Review', desc: 'Our team reviews your profile and credentials to ensure quality and authenticity.' },
  { icon: Check, title: 'Get Approved', desc: 'Once verified, your profile becomes visible to verified recruiters with masked personal details.' },
  { icon: Search, title: 'Find Opportunities', desc: 'Browse matching job listings or wait for recruiters to discover your profile.' },
  { icon: Users2, title: 'Connect with Recruiters', desc: 'When a recruiter unlocks your profile, you receive their contact details and can begin the conversation.' },
]

const recruiterSteps = [
  { icon: Building2, title: 'Register', desc: 'Create your recruiter account with your organization details.' },
  { icon: ShieldCheck, title: 'Organisation Verification', desc: 'Our team verifies your hospital or recruitment agency to ensure legitimacy.' },
  { icon: Search, title: 'Search Candidates', desc: 'Use advanced filters to search verified healthcare professionals by specialty, experience, location.' },
  { icon: Eye, title: 'View Masked Profiles', desc: 'Browse candidate profiles with masked names, phone numbers, and email addresses.' },
  { icon: Lock, title: 'Unlock Candidate', desc: 'Use credits to unlock a candidates full profile including contact information and resume.' },
  { icon: Download, title: 'Access Resume and Contact', desc: 'Download the candidates complete resume and get direct contact details.' },
  { icon: Briefcase, title: 'Hire', desc: 'Reach out directly, schedule interviews, and make your offer to qualified pre-screened candidates.' },
]

function TimelineColumn({ tag, title, subtitle, steps, tone }) {
  return (
    <div>
      <Badge tone={tone}>{tag}</Badge>
      <h2 className="mt-3 text-2xl font-extrabold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm text-ink-600">{subtitle}</p>

      <ol className="mt-8 flex flex-col">
        {steps.map((s, i) => (
          <li key={s.title} className="relative pb-8 pl-14 last:pb-0">
            {i !== steps.length - 1 && (
              <span className="absolute left-4 top-9 h-full w-px -translate-x-1/2 bg-ink-200" />
            )}
            <span
              className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
                ${tone === 'teal' ? 'bg-accent-50 text-accent-700' : 'bg-brand-50 text-brand-700'}`}
            >
              {i + 1}
            </span>
            <div className="rounded-xl border border-ink-200 bg-white p-5">
              <div className="flex items-center gap-2.5">
                <s.icon className={`h-4 w-4 ${tone === 'teal' ? 'text-accent-600' : 'text-brand-600'}`} />
                <p className="font-semibold text-ink-900">{s.title}</p>
              </div>
              <p className="mt-2 text-sm text-ink-600">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const reviewReasons = [
  { icon: Check, title: 'Guarantees Specialization Accuracy', desc: 'Ensures only qualified healthcare professionals appear in search results.' },
  { icon: Lock, title: 'Zero Credit Wastage', desc: 'Protects recruiters from wasting credits on unverified profiles.' },
  { icon: Building2, title: 'Institutional Quality', desc: 'Maintains quality standards hospitals and clinics expect.' },
  { icon: Users2, title: 'Ecosystem Transparency', desc: 'Builds trust across the entire talent marketplace.' },
]

const recruiterVerification = [
  { icon: XCircle, title: 'Spam Prevention', desc: 'Protects healthcare professionals from spam and unauthorized access.' },
  { icon: ShieldCheck, title: 'Authorized Access Only', desc: 'Ensures only legitimate hospitals and agencies access candidate data.' },
  { icon: Lock, title: 'Compliant Privacy Standards', desc: 'Maintains privacy standards for sensitive professional information.' },
  { icon: UserCheck, title: 'Secure Talent Environment', desc: 'Creates a safe trusted environment for healthcare talent.' },
]

function ReasonList({ eyebrow, title, subtitle, items, tone }) {
  return (
    <div>
      <Badge tone={tone}>{eyebrow}</Badge>
      <h3 className="mt-3 text-2xl font-extrabold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600">{subtitle}</p>
      <div className="mt-6 flex flex-col gap-3">
        {items.map((r) => (
          <div key={r.title} className="flex items-start gap-4 rounded-xl border border-ink-200 bg-white p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone === 'teal' ? 'bg-accent-50 text-accent-700' : 'bg-brand-50 text-brand-700'}`}>
              <r.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">{r.title}</p>
              <p className="mt-0.5 text-sm text-ink-600">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <>
      <section className="container-page py-20 text-center">
        <Badge tone="teal" className="mb-4">Transparent Matching Process</Badge>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold text-ink-900 sm:text-5xl">
          How MedHire Works
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-ink-600">
          A simple, transparent process designed to connect healthcare talent with the right
          opportunities while protecting privacy and ensuring quality at every step.
        </p>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <TimelineColumn
            tag="Candidates"
            title="For Healthcare Professionals"
            subtitle="Your path from registration to your next healthcare opportunity"
            steps={candidateSteps}
            tone="teal"
          />
          <TimelineColumn
            tag="Hospitals"
            title="For Hospitals and Recruiters"
            subtitle="Your path from registration to hiring qualified healthcare professionals"
            steps={recruiterSteps}
            tone="blue"
          />
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <ReasonList
            eyebrow="Verification Standards"
            title="Why Candidate Profiles Are Reviewed"
            subtitle="MedHire maintains strict standards of professional credibility to deliver immediate institutional value."
            items={reviewReasons}
            tone="teal"
          />
          <ReasonList
            eyebrow="Data Protection"
            title="Why Recruiters Are Verified"
            subtitle="Candidate privacy is our absolute priority. We vet all employers before releasing secure clinician profiles."
            items={recruiterVerification}
            tone="blue"
          />
        </div>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Marketplace Transparency"
            title="How Candidate Unlocking Works"
            subtitle="Our credit-based unlocking system protects candidate privacy while giving recruiters the access they need."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-ink-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 font-bold text-ink-500">S</div>
                <Badge tone="error">Masked Profile</Badge>
              </div>
              <p className="mt-4 font-semibold text-ink-900">Dr. S···· K····</p>
              <p className="text-sm font-medium text-brand-600">Cardiologist (MD)</p>
              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-ink-400">Phone Number</dt><dd className="text-ink-900">+91 •••• •••• 50</dd></div>
                <div className="flex justify-between"><dt className="text-ink-400">Email Address</dt><dd className="text-ink-900">s····@····.com</dd></div>
                <div className="flex justify-between"><dt className="text-ink-400">Resume Status</dt><dd className="flex items-center gap-1 font-semibold text-ink-500"><Lock className="h-3.5 w-3.5" /> Locked</dd></div>
              </dl>
            </div>

            <div className="rounded-xl border-2 border-brand-600 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">SK</div>
                <Badge tone="success">Unlocked</Badge>
              </div>
              <p className="mt-4 font-semibold text-ink-900">Dr. Sarah Kapoor</p>
              <p className="text-sm font-medium text-brand-600">Cardiologist (MD)</p>
              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-ink-400">Phone Number</dt><dd className="font-semibold text-ink-900">+91 98765 43210</dd></div>
                <div className="flex justify-between"><dt className="text-ink-400">Email Address</dt><dd className="font-semibold text-ink-900">sarah.kapoor@hosp.in</dd></div>
                <div className="flex justify-between"><dt className="text-ink-400">Resume Status</dt><dd className="flex items-center gap-1 font-semibold text-green-600"><Check className="h-3.5 w-3.5" /> Available (Download)</dd></div>
              </dl>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-ink-500">
            Recruiters purchase credits in tailored bundles. Using a credit reveals the candidate's
            verified legal name, registered direct contact channels, and certified CV documents.
            When unlocked, clinicians are instantly notified of the specific medical institution
            accessing their data, maintaining compliance and absolute platform integrity.
          </p>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-accent-50 p-8">
            <h3 className="text-2xl font-bold text-accent-800">Ready to Find Your Next Healthcare Role?</h3>
            <p className="mt-3 text-sm text-accent-700">
              Create your secure, masked profile and allow leading medical registries and verified
              recruiters to pitch direct opportunities to you.
            </p>
            <Link to="/register/candidate">
              <Button variant="accent" className="mt-6">Create Your Profile</Button>
            </Link>
          </div>
          <div className="rounded-2xl bg-brand-50 p-8">
            <h3 className="text-2xl font-bold text-brand-800">Ready to Hire Healthcare Talent?</h3>
            <p className="mt-3 text-sm text-brand-700">
              Register your healthcare facility, complete clinical verification, and search
              thousands of certified specialists immediately.
            </p>
            <Link to="/register/recruiter">
              <Button className="mt-6" icon={Briefcase} iconPosition="right">Start Hiring</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
