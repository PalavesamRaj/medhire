import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import Button from '../components/ui/Button'
import panelImage from '../assets/security-shields.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
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
      panelImageClassName="h-96 w-full rounded-t-xl object-center"
      panelImageContainerClassName="mx-auto w-[90%] rounded-t-xl rounded-b-none"
      panelImageAtBottom
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Email Address">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" className="w-full justify-center">
            Send Reset Link
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
