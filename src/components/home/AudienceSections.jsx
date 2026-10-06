import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import candidateImage from '../../assets/tablet-patient-dashboard.png'
import recruiterImage from '../../assets/laptop-nursing-candidates.png'

export function ForCandidates() {
  const points = [
    'Professional profile showcasing your healthcare credentials',
    'AI-powered job matching for your specialty and experience',
    'Verified hospital and recruiter connections only',
    'Track applications and manage your career in one place',
  ]

  return (
    <section className="bg-ink-50/60 py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold text-ink-900">Build Your Healthcare Career</h2>
          <p className="mt-4 text-sm text-ink-600">
            Create your professional profile and get discovered by top hospitals and healthcare
            organizations globally.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                {p}
              </li>
            ))}
          </ul>
          <Link to="/register/candidate" className="mt-8 inline-block">
            <Button icon={Plus} iconPosition="right">
              Create Your Profile
            </Button>
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <img
            src={candidateImage}
            alt="Clinician profile dashboard on a tablet"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export function ForRecruiters() {
  const points = [
    'Browse verified, pre-screened healthcare candidates',
    'Advanced filters by specialty, certification, and location',
    'Credit-based system — pay only for candidates you unlock',
    'Streamlined hiring pipeline with built-in communication tools',
  ]

  return (
    <section className="py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 overflow-hidden rounded-2xl lg:order-1">
          <img
            src={recruiterImage}
            alt="Verified nursing candidates list on a laptop"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="order-1 lg:order-2">
          <Badge tone="teal">For Recruiters</Badge>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
            Find Healthcare Talent Faster
          </h2>
          <p className="mt-4 text-sm text-ink-600">
            Access a curated, continuous pool of pre-screened healthcare professionals verified
            by national registries.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {p}
              </li>
            ))}
          </ul>
          <Link to="/register/recruiter" className="mt-8 inline-block">
            <Button>Explore Talent Pool</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
