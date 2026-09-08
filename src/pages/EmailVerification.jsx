import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import Button from '../components/ui/Button'
import panelImage from '../assets/verfiytheemail.png'

const roleCopy = {
  candidate: 'candidate account',
  recruiter: 'recruiter account',
}

export default function EmailVerification() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'
  const email = searchParams.get('email') || 'your email address'
  const source = searchParams.get('source') || 'registration'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (code !== '123456') {
      setError('That code is not valid. Use 123456 for this demo flow.')
      return
    }

    if (source === 'reset') {
      navigate(`/reset-password?role=${role}&email=${encodeURIComponent(email)}`)
      return
    }

    navigate(`/login?verified=true&role=${role}`)
  }

  return (
    <AuthSplitLayout
      formTitle="Verify Your Email"
      formSubtitle={`Enter the six-digit code sent to ${email} to verify your ${roleCopy[role]}.`}
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-lg border border-accent-100 bg-accent-50 p-4 text-sm text-accent-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>We sent a verification code to your email address.</p>
        </div>

        <Field label="Verification Code" hint="For this demo, use 123456.">
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
        {error && <p className="-mt-3 text-xs text-red-600">{error}</p>}

        <Button type="submit" className="w-full justify-center">
          Verify Email
        </Button>

        <button
          type="button"
          onClick={() => setResent(true)}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
          {resent ? 'Code sent again' : 'Resend code'}
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