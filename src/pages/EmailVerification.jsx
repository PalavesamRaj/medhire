import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import Logo from '../components/layout/Logo'
import RecoveryPanel from '../components/auth/RecoveryPanel'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateVerification } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import verificationImage from '../assets/verfiytheemail.png'

export default function EmailVerification() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'
  const email = searchParams.get('email') || ''
  const source = searchParams.get('source') || 'registration'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(102)
  const inputRefs = useRef([])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const maskedEmail = email
    ? `${email.slice(0, 1)}${'•'.repeat(Math.max(4, Math.min(email.indexOf('@') - 1, 5)))}${email.slice(email.indexOf('@'))}`
    : 'your email address'
  const formattedTime = `00:${String(Math.max(secondsLeft, 0)).padStart(2, '0')}`
  const isExpired = secondsLeft <= 0

  const updateCode = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextCode = code.split('')
    nextCode[index] = digit
    setCode(nextCode.join('').slice(0, 6))
    setError('')
    setResent(false)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (event) => {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedCode) return
    event.preventDefault()
    setCode(pastedCode)
    setError('')
    inputRefs.current[Math.min(pastedCode.length, 6) - 1]?.focus()
  }

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
        showToast('Email verified. You can now create a new password.')
        navigate(`/reset-password?role=${role}&email=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(response.resetToken || '')}`)
      } else if (source === 'reset') {
        setError('Verification succeeded, but the reset session was not returned. Request a new code.')
      } else {
        showToast('Email verified successfully. You can now log in.')
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
      showToast('A new verification code has been sent.')
      setResent(true)
      setCode('')
      setSecondsLeft(102)
      inputRefs.current[0]?.focus()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-ink-50">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-20 lg:py-14">
        <div className="w-full max-w-[520px]">
          <Link to="/" className="mb-7 flex items-center gap-2">
            <Logo />
          </Link>

        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-extrabold text-ink-900">Verify Your Email</h1>
            <p className="text-sm leading-5 text-ink-600">We&apos;ve sent a verification code to the registered email address.</p>
            <p className="text-sm font-semibold text-ink-900">{maskedEmail}</p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            <div className="flex gap-2.5" onPaste={handlePaste}>
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => { inputRefs.current[index] = element }}
                  value={code[index] || ''}
                  onChange={(event) => updateCode(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Verification digit ${index + 1}`}
                  className="h-14 min-w-0 flex-1 rounded-md border-[1.5px] border-brand-600 bg-white text-center text-xl font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 text-xs text-ink-600">
              <Clock3 className="h-3.5 w-3.5" />
              Code expires in {formattedTime}
            </div>

            <Button type="submit" disabled={loading || isExpired} className="h-11 w-full justify-center">
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="flex items-center justify-between text-xs font-semibold">
              <Link to={source === 'reset' ? '/forgot-password' : `/register/${role}`} className="text-brand-600 hover:text-brand-700">
                Change Email
              </Link>
              <button type="button" onClick={handleResend} disabled={resendLoading} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 disabled:text-ink-400">
                <RefreshCw className="h-3.5 w-3.5" />
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            {error && <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-xs font-semibold">{isExpired ? 'Code expired' : 'Invalid code'}</p><p className="mt-0.5 text-xs leading-4">{isExpired ? 'This verification code has expired. Request a new code.' : error}</p></div></div>}
            {isExpired && !error && <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-xs font-semibold">Code expired</p><p className="mt-0.5 text-xs leading-4">This verification code has expired. Request a new code.</p></div></div>}
            {resent && <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-xs font-semibold">Code resent successfully</p><p className="mt-0.5 text-xs leading-4">A new code has been sent to {maskedEmail}.</p></div></div>}
          </form>
          </section>
        </div>
      </div>

      <RecoveryPanel image={verificationImage} imageAlt="Healthcare professionals in a clinical team" />
    </main>
  )
}