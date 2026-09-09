import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateForgotPassword } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import panelImage from '../assets/security-shields.png'

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
    <AuthSplitLayout
      formTitle={sent ? 'Check Your Email' : 'Forgot Password?'}
      formSubtitle={
        sent
          ? `We've sent a verification code to ${email}.`
          : "No worries, we'll send you reset instructions."
      }
      panelTitle="Your Account, Secured"
      panelPoints={[
        'Reset links expire after 30 minutes for your security',
        'Only you can access your registered email',
        'Institution-grade security on every account',
      ]}
      panelImage={panelImage}
      panelImageAlt="Security and compliance"
      panelImageClassName="h-96 w-full rounded-xl object-center"
      panelImageContainerClassName="mx-auto w-full rounded-xl"
      panelImageAtBottom
      layoutClassName="lg:grid-cols-[60%_40%]"
      formColumnClassName="lg:px-12"
      formWidthClassName="max-w-[400px]"
      panelClassName="lg:px-10"
    >
      {sent ? (
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-accent-700">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="text-sm text-ink-500">
            Didn&apos;t get the email? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              try a different email
            </button>
            .
          </p>
          <Link
            to={`/verify-email?email=${encodeURIComponent(email)}&source=reset`}
            className="w-full"
          >
            <Button variant="secondary" className="w-full justify-center">
              Enter Verification Code
            </Button>
          </Link>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Field label="Email Address" error={fieldErrors.email}>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(fieldErrors.email)}
              required
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <p className="text-center text-sm text-ink-500">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  )
}
