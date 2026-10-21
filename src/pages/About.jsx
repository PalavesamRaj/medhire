import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Search, Lock, Stethoscope, ShieldCheck, Eye, Users, Check, Building2 } from 'lucide-react'
import SectionHeading from '../components/ui/SectionHeading'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import missionImage from '../assets/hospital-lobby.png'
import candidateImage from '../assets/candidate-tablet-hallway.png'
import recruiterImage from '../assets/recruiter-candidate-grid.png'
import securityImage from '../assets/security-shields.png'

const failures = [
  {
    icon: Briefcase,
    title: 'Fragmented Platforms',
    desc: 'Clinical roles are force-fit into generic templates on sites that do not understand medical sub-specialties, nursing structures, or clinical registry standards.',
  },
  {
    icon: Search,
    title: 'Wasted Recruiter Hours',
    desc: 'Hospital HR directors sort through hundreds of unverified resumes, only to find that the candidate\u2019s state license has expired or holds the wrong certifications.',
  },
  {
    icon: Lock,
    title: 'Exposed Clinical Data',
    desc: 'Medical professionals find their private contact numbers and physical addresses leaked to third-party telemarketers without consent.',
  },
]

const advantages = [
  { icon: Stethoscope, title: 'Specialty-Aware Profiles', desc: 'Built specifically around verified medical credentials, board clearances, registry certifications, and critical clinical skills.' },
  { icon: ShieldCheck, title: 'Pre-Screened Licensure', desc: 'Every practitioner undergoes thorough active registry validation by our expert operations team before matching with any healthcare group.' },
  { icon: Eye, title: 'Privacy-Locked Resumes', desc: 'Contact information and full PDF resumes remain completely hidden behind state security locks until unlocked with direct recruiter credits.' },
  { icon: Users, title: 'Direct Recruitment', desc: 'Direct communication with active clinicians reduces hiring cycles, overhead agency fees, and overall placement friction.' },
]

const candidatePoints = [
  'Build a comprehensive profile highlighting clinical certifications & registry approvals.',
  'Protect sensitive contact information — share only with explicit consent.',
  'Gain direct visibility into top national hospital networks and urgent specialist searches.',
  'Track recruiter profile views, credential unlocks, and interview schedules in real-time.',
  'Always free to join and explore open clinician slots.',
]

const recruiterPoints = [
  'Access hundreds of pre-screened, board-cleared healthcare professionals.',
  'Narrow candidates down using rich filters: specialty, license state, and clinical board.',
  'Utilize direct matching credit allocations — no high commission agency overhead.',
  'Reach active clinical candidates instantly via secure built-in communication systems.',
  'Custom organizational workspace matching strict hospital compliance guidelines.',
]

const values = [
  { icon: ShieldCheck, title: 'Trust', desc: 'Every candidate and recruiter undergoes direct validation by our ops team before appearing in matches. We keep quality at the center.' },
  { icon: Lock, title: 'Privacy First', desc: 'All critical credentials and contact records are locked by default. Candidates retain complete control of who can unlock their profiles.' },
  { icon: Check, title: 'Quality Matching', desc: 'We focus purely on healthcare. No distracting generalist noise, just high-density clinical matching with accurate medical specs.' },
  { icon: Building2, title: 'Clinical Focus', desc: 'Built from the ground up for hospitals, diagnostic labs, and medical groups, prioritizing the complex constraints of medical compliance.' },
]

const stats = [
  { value: '25,000+', label: 'Healthcare Professionals' },
  { value: '2,500+', label: 'Verified Recruiters' },
  { value: '500+', label: 'Partner Hospitals' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const security = [
  { title: 'Masked Contact Details', desc: 'All candidate profiles display randomized placeholder names and scrambled contact data until they clear mutual verification locks.' },
  { title: 'Locked Practitioner Resumes', desc: 'Full credential documents and CVs are encrypted and protected behind registry credentials by default.' },
  { title: 'Hospital Verification Sprints', desc: 'Every single recruiter is strictly checked against hospital registries and medical group IDs before accessing our candidate base.' },
  { title: 'Candidate Profile Control', desc: 'Practitioners can toggle search visibility, restrict specific hospital domains, or pause active matches with one click.' },
]

export default function About() {
  return (
    <>
      <section className="container-page py-20 text-center">
        <Badge tone="blue" className="mb-4">Meet MedHire</Badge>
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold text-ink-900 sm:text-4xl">
          Healthcare Hiring, Built for Healthcare
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-ink-600">
          MedHire is the dedicated recruitment marketplace that connects qualified healthcare
          professionals with verified hospitals and recruiters — with trust, privacy, and quality
          at its core.
        </p>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="teal">Our Mission</Badge>
            <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
              Pioneering Safe & Specialty-Aware Medical Matching
            </h2>
            <p className="mt-4 text-ink-600">
              Our core driving force is simple yet transformational: we seek to replace the
              chaotic noise of general-purpose recruiting with a highly secure, clinical-aware
              ecosystem where healthcare professionals feel protected and hospital operations run
              smoothly.
            </p>
            <p className="mt-4 text-ink-600">
              We understand that a nurse practitioner's credentials or a cardiologist's board
              certifications are highly sensitive milestones. By validating clinical licensure at
              the root and allowing privacy controls, we bridge the gap with true institutional
              dignity.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img
              src={missionImage}
              alt="Hospital reception lobby"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="The Hard Reality"
          title="The Critical Failures in Healthcare Recruitment"
          subtitle="Generalist job networks ignore the delicate nuances of medical credentialing and practitioner privacy."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {failures.map((f) => (
            <div key={f.title} className="rounded-xl border border-ink-200 bg-ink-50/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                <f.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-ink-900">{f.title}</p>
              <p className="mt-2 text-sm text-ink-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our Solutions"
            title="The MedHire Marketplace Advantage"
            subtitle="A structured matching standard designed exclusively for Direct Healthcare Connections."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-xl border border-ink-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                  <a.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-ink-900">{a.title}</p>
                <p className="mt-2 text-sm text-ink-600">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="teal">For Candidates</Badge>
            <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
              Accelerate Your Medical Journey
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {candidatePoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/register/candidate">
              <Button className="mt-8">Create Your Profile</Button>
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img
              src={candidateImage}
              alt="Clinician reviewing records on a tablet in a hospital corridor"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-ink-50/60 py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={recruiterImage}
              alt="Recruiting team reviewing candidate grid on a desktop monitor"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <Badge tone="blue">For Recruiters</Badge>
            <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
              Institution-Grade Medical Sourcing
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {recruiterPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/register/recruiter">
              <Button className="mt-8">Start Hiring Today</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="What We Stand For"
          title="MedHire Core Platform Values"
          subtitle="These foundational directives shape how we design tools and protect our users."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-ink-200 bg-ink-50/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <v.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-ink-900">{v.title}</p>
              <p className="mt-2 text-sm text-ink-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-200 bg-ink-50/60">
        <div className="container-page grid grid-cols-2 divide-x divide-ink-200 py-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-ink-900">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-ink-900">
            <img
              src={securityImage}
              alt="Encrypted medical record security shields illustration"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <Badge tone="blue">Security & Privacy</Badge>
            <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
              Institutional Trust Built In By Design
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              {security.map((s) => (
                <div key={s.title} className="flex gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <div>
                    <p className="font-semibold text-ink-900">{s.title}</p>
                    <p className="mt-1 text-sm text-ink-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-900">
        <div className="container-page py-20 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Join the Healthcare Talent Network
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Whether you're a healthcare professional looking for your next opportunity or a
            recruiter searching for qualified talent — MedHire is built for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register/candidate">
              <Button size="lg" variant="secondary">Create Your Profile</Button>
            </Link>
            <Link to="/register/recruiter">
              <Button size="lg" variant="outline">Start Hiring</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
