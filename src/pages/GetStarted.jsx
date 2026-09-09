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

      <h1 className="mt-8 w-full max-w-[600px] text-center text-3xl font-extrabold text-ink-900 sm:text-3xl">
        Join the Healthcare Network
      </h1>
      <p className="mt-2 text-center text-xs text-ink-500">Choose how you want to use the platform.</p>

      <div className="mt-9 grid w-full max-w-[912px] gap-6 sm:grid-cols-2">
        {roles.map((r) => (
          <div
            key={r.title}
            className="flex min-h-[480px] flex-col rounded-xl border border-ink-200 bg-white p-8"
          >
            <div className="mx-auto flex w-full max-w-[344px] flex-1 flex-col">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${r.iconTone}`}>
                <r.icon className="h-7 w-7" />
              </div>
              <h2 className="mt-7 text-2xl font-bold text-ink-900">{r.title}</h2>
              <p className="mt-2 flex-1 text-base leading-relaxed text-ink-600">{r.desc}</p>
              <Link to={r.to} className="mt-8 w-full">
                <Button variant={r.variant} className="h-14 w-full justify-center text-lg">
                  {r.cta}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-9 text-xs text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Login
        </Link>
      </p>
    </div>
  )
}
