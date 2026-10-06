import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { storeAuthSession } from '../lib/authSession'
import { isRecruiterOrganizationApproved } from '../lib/recruiterAuthApi'
import { recruiterApi } from '../lib/recruiterApi'
import { validateLogin } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import panelImage from '../assets/login.png'

const loginPanelTitle = 'Connecting Healthcare, Seamlessly'

const loginPanelPoints = [
  'A trusted platform for healthcare professionals and employers',
  'Verified profiles and meaningful career connections',
  'Secure, compliant, and built for the healthcare industry',
]

export default function Login() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => {
    setFieldErrors((errors) => {
      const nextErrors = { ...errors }
      delete nextErrors[field]
      return nextErrors
    })
    setError('')
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateLogin(form)
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError('Please enter valid login details.')
      return
    }
    setFieldErrors({})
    setError('')
    setLoading(true)
    try {
      const response = await authApi.login({ email: form.email.trim().toLowerCase(), password: form.password, rememberMe: form.remember })
      const role = String(response.user?.role || response.role || '').toLowerCase()
      if (!['candidate', 'recruiter'].includes(role)) {
        throw new Error('The login service returned an incomplete account session. Please try again.')
      }
      if (response.user?.emailVerified === false) {
        const email = response.user.email || form.email.trim().toLowerCase()
        await authApi.resendCode({ email, purpose: 'registration' })
        showToast('Verify your email to continue.')
        navigate(`/verify-email?role=${role}&email=${encodeURIComponent(email)}&source=registration`)
        return
      }
      if (!response.accessToken) {
        throw new Error('The login service returned an incomplete account session. Please try again.')
      }
      storeAuthSession(response, form.remember)
      showToast('Welcome back. You are now logged in.')
      if (role === 'candidate') {
        try {
          const identity = JSON.parse(sessionStorage.getItem('medhire_candidate_identity') || 'null')
          const email = response.user?.email || form.email.trim()
          if (identity?.email !== email) sessionStorage.removeItem('medhire_candidate_profile_draft')
          sessionStorage.setItem('medhire_candidate_identity', JSON.stringify({ email }))
        } catch { /* Profile editing remains available when storage is disabled. */ }
        const nextStepRoutes = { resume: 'resume', personal: 'personal', professional: 'professional', education: 'education', experience: 'work-experience', skills: 'skills', certifications: 'certifications', preferences: 'career-preferences' }
        const nextStep = nextStepRoutes[response.onboarding?.nextStep]
        navigate(response.user?.profileCompleted || response.onboarding?.profileCompleted ? '/candidate/dashboard' : nextStep ? `/candidate/profile/${nextStep}` : '/candidate/profile/resume')
      } else if (role === 'recruiter') {
        if (!isRecruiterOrganizationApproved(response.user)) {
          navigate('/recruiter/verification-pending')
        } else {
          try {
            const jobsResponse = await recruiterApi.getJobs()
            const jobsData = jobsResponse?.data || jobsResponse
            const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.jobs || jobsData?.items || jobsData?.results || []
            navigate(jobs.length ? '/recruiter/dashboard' : '/recruiter/jobs')
          } catch {
            navigate('/recruiter/dashboard')
          }
        }
      } else navigate('/')
    } catch (requestError) {
      if (requestError.code === 'EMAIL_NOT_VERIFIED') {
        const email = form.email.trim().toLowerCase()
        showToast('Verify your email to continue. Enter your recent code or request a new one.')
        navigate(`/verify-email?email=${encodeURIComponent(email)}&source=registration`)
        return
      }
      setError(requestError.message)
      setFieldErrors(requestError.fieldErrors || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      formTitle="Welcome Back"
      formSubtitle="Log in to your MedHire account to continue."
      panelTitle={loginPanelTitle}
      panelPoints={loginPanelPoints}
      panelImage={panelImage}
      panelImageAlt="Hospital lobby"
      panelImageClassName="h-[246px] w-full rounded-t-xl rounded-b-none object-center"
      panelImageContainerClassName="mx-auto w-full rounded-t-xl rounded-b-none"
      panelImageAtBottom
      layoutClassName="lg:grid-cols-[60%_40%]"
      formColumnClassName="lg:px-12"
      formWidthClassName="max-w-[520px]"
      panelClassName="lg:px-12 lg:pt-16"
      panelTitleClassName="text-[28px]"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={update('remember')}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-600/30"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Logging In...' : 'Log In'}
        </Button>

        <p className="text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link to="/get-started" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
