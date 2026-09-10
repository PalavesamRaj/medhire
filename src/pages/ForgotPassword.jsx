import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Logo from '../components/layout/Logo'
import { Field, Input } from '../components/ui/FormControls'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateForgotPassword } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'

export default function ForgotPassword() {
  const showToast = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForgotPassword(email)
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError('Please enter a valid email address.')
      return
    }
    setFieldErrors({})
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      showToast('Reset instructions sent. Check your email for the verification code.')
      setSent(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-ink-50 px-5 py-10 sm:py-16">
      <div className="w-full max-w-[520px]">
        <Link to="/" className="mb-8 flex justify-center sm:mb-9">
          <Logo />
        </Link>

        <section className="rounded-xl border border-ink-200 bg-white px-8 py-8 shadow-sm sm:px-9 sm:py-9">
          <h1 className="text-center text-2xl font-extrabold text-ink-900">Forgot Your Password?</h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm leading-5 text-ink-500">
            Enter your registered email and we&apos;ll send verification instructions
            <br className="hidden sm:block" /> to reset your password.
          </p>

          <form noValidate onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3.5">
            <Field label="Email Address" error={fieldErrors.email}>
              <Input
                type="email"
                placeholder="Enter your registered email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={Boolean(fieldErrors.email)}
                className="w-full"
                required
              />
            </Field>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-1 w-full justify-center">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>

            <p className="text-center text-sm">
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                <ArrowLeft className="mr-1 inline-block h-4 w-4 align-text-bottom" />
                Back to Login
              </Link>
            </p>
          </form>
        </section>

        {sent && (
          <>
            <p className="mt-6 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              Success State Preview
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-xs text-green-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Verification code sent successfully.</p>
                <p>Please check your email inbox and follow the instructions to reset your password.</p>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email)}&source=reset`}
                  className="mt-1 inline-block font-semibold underline underline-offset-2"
                >
                  Enter verification code
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
