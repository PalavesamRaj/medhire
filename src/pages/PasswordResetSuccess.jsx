import React from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2 } from 'lucide-react'
import Logo from '../components/layout/Logo'
import Button from '../components/ui/Button'
import securityImage from '../assets/security-shields.png'

export default function PasswordResetSuccess() {
  return (
    <main className="flex min-h-screen bg-ink-50">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-20 lg:py-14">
        <div className="w-full max-w-[520px]">
          <Link to="/" className="mb-7 flex items-center gap-2">
            <Logo />
          </Link>

          <section className="flex flex-col items-center gap-6 rounded-xl border border-ink-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <div className="flex w-full flex-col gap-2.5">
              <h1 className="text-3xl font-extrabold text-ink-900">Password Reset Successfully</h1>
              <p className="text-sm leading-5 text-ink-600">
                Your password has been updated. You can now sign in using your new password.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button className="h-11 w-full justify-center">Back to Login</Button>
            </Link>
            <p className="w-full text-xs text-ink-600">
              For your security, all other active sessions have been signed out.
            </p>
          </section>
        </div>
      </div>

      <aside className="hidden w-[580px] flex-col gap-10 bg-gradient-to-b from-brand-900 to-ink-900 px-14 pt-20 lg:flex">
        <Logo light />
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold leading-10 text-white">Your Healthcare Career Awaits</h2>
          <ul className="flex flex-col gap-4">
            {['Secure account recovery', 'Your privacy is always protected', 'Trusted by healthcare professionals'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-1 items-end">
          <img src={securityImage} alt="Digital security shields protecting healthcare data" className="h-72 w-full rounded-t-2xl object-cover object-center" />
        </div>
      </aside>
    </main>
  )
}