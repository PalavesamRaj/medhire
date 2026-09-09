import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateRegistration } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import heroImage from '../assets/verfiytheemail.png'

export default function RegisterCandidate() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateRegistration(form, 'candidate')
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError('Please correct the highlighted fields.')
      return
    }
    setFieldErrors({})
    setError('')
    setLoading(true)
    try {
      await authApi.register({
        role: 'candidate',
        fullName: form.name,
        email: form.email,
        phone: `+91${form.phone.replace(/\D/g, '')}`,
        password: form.password,
        termsAccepted: form.agree,
      })
      showToast('Account created. Check your email for the verification code.')
      navigate(`/verify-email?role=candidate&email=${encodeURIComponent(form.email)}&source=registration`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      formTitle="Create Your Professional Account"
      formSubtitle="Start your healthcare career journey with MedHire."
      panelTitle="Your Healthcare Career Starts Here"
      panelPoints={[
        'Create your professional healthcare profile',
        'Get discovered by verified hospitals',
        'Free for all healthcare professionals',
      ]}
      panelImage={heroImage}
      panelImageAlt="Group of healthcare professionals"
      panelImageClassName="h-96 w-full rounded-t-xl rounded-b-none object-center"
      panelImageContainerClassName="mx-auto w-full rounded-t-xl rounded-b-none"
      panelImageAtBottom
      layoutClassName="lg:grid-cols-[60%_40%]"
      formColumnClassName="lg:px-12"
      formWidthClassName="max-w-[520px]"
      panelClassName="lg:px-10"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Field label="Full Name" error={fieldErrors.name}>
          <Input
            placeholder="Enter your full name"
            value={form.name}
            onChange={update('name')}
            error={Boolean(fieldErrors.name)}
            className="w-full"
            required
          />
        </Field>

        <Field label="Email Address" error={fieldErrors.email}>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={update('email')}
            error={Boolean(fieldErrors.email)}
            className="w-full"
            required
          />
        </Field>

        <Field label="Mobile Number" error={fieldErrors.phone}>
          <div className={`flex overflow-hidden rounded-lg border focus-within:ring-2 ${fieldErrors.phone ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-ink-200 focus-within:border-brand-600 focus-within:ring-brand-600/30'}`}>
            <span className="flex items-center border-r border-ink-200 bg-ink-50 px-3.5 text-sm text-ink-500">
              +91
            </span>
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={form.phone}
              onChange={update('phone')}
              aria-invalid={Boolean(fieldErrors.phone) || undefined}
              className="flex-1 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
              required
            />
          </div>
        </Field>

        <PasswordField
          label="Password"
          placeholder="Create a password"
          value={form.password}
          onChange={update('password')}
          showStrength
          error={fieldErrors.password}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <PasswordField
          label="Confirm Password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={fieldErrors.confirmPassword}
        />

        <label className="flex items-start gap-2.5 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={update('agree')}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-600/30"
            required
          />
          <span>
            I agree to the{' '}
            <Link to="/terms-of-service" className="font-medium text-brand-600 hover:text-brand-700">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="font-medium text-brand-600 hover:text-brand-700">
              Privacy Policy
            </Link>
          </span>
        </label>
        {fieldErrors.agree && <p className="-mt-3 text-xs font-medium text-red-600">{fieldErrors.agree}</p>}

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
