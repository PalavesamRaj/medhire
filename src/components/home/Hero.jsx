import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button'
import heroImage from '../../assets/hero-doctor-nurse.png'

export default function Hero() {
  return (
    <section className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          New: Integrated Credential Verification
        </span>

        <h1 className="mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
          Connecting Healthcare Talent With Better Opportunities
        </h1>

        <p className="mt-5 max-w-lg text-sm text-ink-600">
          The trusted marketplace where healthcare professionals find verified opportunities and
          hospitals discover pre-screened, qualified candidates — faster and smarter.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/find-jobs">
            <Button size="lg" icon={ArrowRight}>
              Find Healthcare Jobs
            </Button>
          </Link>
          <Link to="/register/recruiter">
            <Button size="lg" variant="secondary">
              Hire Healthcare Talent
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-ink-400">
          <ShieldCheck className="h-4 w-4 text-accent-600" />
          Trusted by 500+ hospitals and 25,000+ certified medical professionals.
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl">
        <img
          src={heroImage}
          alt="Healthcare professionals in a clinical setting"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  )
}
