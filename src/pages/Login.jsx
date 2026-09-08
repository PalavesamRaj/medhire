import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateLogin } from '../lib/authValidation'
import panelImage from '../assets/login.png'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
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
      const response = await authApi.login({
        email: form.email,
        password: form.password,
        rememberMe: form.remember,
      })
      if (response.accessToken) localStorage.setItem('medhire_access_token', response.accessToken)
      if (response.refreshToken) {
        const storage = form.remember ? localStorage : sessionStorage
        storage.setItem('medhire_refresh_token', response.refreshToken)
      }
      navigate('/')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      formTitle="Welcome Back"
      formSubtitle="Log in to your MedHire account to continue."
      panelTitle="Healthcare Hiring, Simplified"
      panelPoints={[
        'Verified profiles for every healthcare professional',
        'Trusted by hospitals and clinics nationwide',
        'Secure, compliant, and built for the industry',
      ]}
      panelImage={panelImage}
      panelImageAlt="Hospital lobby"
      panelImageClassName="h-96 w-full rounded-t-xl object-center"
      panelImageContainerClassName="mx-auto w-[90%] rounded-t-xl rounded-b-none"
      panelImageAtBottom
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Email Address" error={fieldErrors.email}>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={update('email')}
            error={Boolean(fieldErrors.email)}
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
