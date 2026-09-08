import React from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, Building2 } from 'lucide-react'
import Logo from '../components/layout/Logo'
import Button from '../components/ui/Button'

const roles = [
  {
    icon: Stethoscope,
    iconTone: 'bg-accent-50 text-accent-700',
    title: 'Healthcare Professional',
    desc: 'For doctors, nurses, pharmacists, technicians and other healthcare professionals looking for career opportunities.',
    cta: 'Register as Candidate',
    to: '/register/candidate',
    variant: 'primary',
  },
  {
    icon: Building2,
    iconTone: 'bg-brand-50 text-brand-700',
    title: 'HR / Recruiter',
    desc: 'For hospitals, healthcare organizations and recruitment teams looking to hire qualified healthcare talent.',
    cta: 'Register as Recruiter',
    to: '/register/recruiter',
    variant: 'secondary',
  },
]

export default function GetStarted() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50/60 px-6 py-16">
      <Link to="/">
        <Logo />
      </Link>

      <h1 className="mt-8 text-center text-3xl font-extrabold text-ink-900 sm:text-4xl">
        Join the Healthcare Network
      </h1>
      <p className="mt-3 text-center text-ink-500">Choose how you want to use the platform.</p>

      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {roles.map((r) => (
          <div
            key={r.title}
            className="flex flex-col rounded-2xl border border-ink-200 bg-white p-8"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${r.iconTone}`}>
              <r.icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink-900">{r.title}</h2>
            <p className="mt-2 flex-1 text-sm text-ink-600">{r.desc}</p>
            <Link to={r.to} className="mt-8">
              <Button variant={r.variant} className="w-full justify-center">
                {r.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Login
        </Link>
      </p>
    </div>
  )
}
