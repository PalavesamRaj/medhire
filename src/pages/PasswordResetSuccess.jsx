import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Logo from '../components/layout/Logo'
import RecoveryPanel from '../components/auth/RecoveryPanel'
import Button from '../components/ui/Button'
import securityImage from '../assets/security-shields.png'

export default function PasswordResetSuccess() {
  return (
    <main className="flex min-h-screen bg-ink-50">
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-[520px]">
          <Link to="/" className="mb-7 flex items-center gap-2">
            <Logo />
          </Link>

          <section className="flex flex-col items-center gap-6 rounded-xl border border-ink-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <div className="flex w-full flex-col gap-2.5">
              <h1 className="text-2xl font-extrabold text-ink-900">Password Reset Successfully</h1>
              <p className="text-sm leading-5 text-ink-600">
                Your password has been updated. You can now sign in using your new password.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button className="w-full justify-center">Back to Login</Button>
            </Link>
            <p className="w-full text-xs text-ink-600">
              For your security, all other active sessions have been signed out.
            </p>
          </section>
        </div>
      </div>

      <RecoveryPanel image={securityImage} imageAlt="Digital security shields protecting healthcare data" />
    </main>
  )
}