import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateVerification } from '../lib/authValidation'
import panelImage from '../assets/verfiytheemail.png'

const roleCopy = {
  candidate: 'candidate account',
  recruiter: 'recruiter account',
}

export default function EmailVerification() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'
  const email = searchParams.get('email') || ''
  const source = searchParams.get('source') || 'registration'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateVerification(email, code)
    if (Object.keys(validationErrors).length) {
      setError(validationErrors.code || validationErrors.email)
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await authApi.verifyCode({
        email,
        code,
        purpose: source === 'reset' ? 'password_reset' : 'registration',
      })
      if (source === 'reset' && response.resetToken) {
        navigate(`/reset-password?role=${role}&email=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(response.resetToken || '')}`)
      } else if (source === 'reset') {
        setError('Verification succeeded, but the reset session was not returned. Request a new code.')
      } else {
        navigate(`/login?verified=true&role=${role}`)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResendLoading(true)
    try {
      await authApi.resendCode({ email, purpose: source === 'reset' ? 'password_reset' : 'registration' })
      setResent(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      formTitle="Verify Your Email"
      formSubtitle={`Enter the six-digit code sent to ${email || 'your email address'} to verify your ${roleCopy[role]}.`}
      panelTitle="A Trusted Healthcare Network"
      panelPoints={[
        'Every account starts with a verified email address',
        'Your professional information stays protected',
        'Secure access for healthcare professionals and employers',
      ]}
      panelImage={panelImage}
      panelImageAlt="Security and compliance"
      panelImageClassName="h-96 w-full rounded-t-xl object-center"
      panelImageContainerClassName="mx-auto w-[90%] rounded-t-xl rounded-b-none"
      panelImageAtBottom
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-lg border border-accent-100 bg-accent-50 p-4 text-sm text-accent-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>We sent a verification code to your email address.</p>
        </div>

        <Field
          label="Verification Code"
          hint="Enter the six-digit code sent to your email."
          error={error && /^Enter the six-digit/.test(error) ? error : undefined}
        >
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ''))
              setError('')
            }}
            error={Boolean(error)}
            required
          />
        </Field>
        {error && !/^Enter the six-digit/.test(error) && <p className="-mt-3 text-xs text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
          {resendLoading ? 'Sending...' : resent ? 'Code sent again' : 'Resend code'}
        </button>

        <p className="text-center text-sm text-ink-500">
          Wrong email?{' '}
          <Link to={source === 'reset' ? '/forgot-password' : `/register/${role}`} className="font-semibold text-brand-600 hover:text-brand-700">
            Go back
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}