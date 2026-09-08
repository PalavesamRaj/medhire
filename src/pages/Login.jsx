import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import panelImage from '../assets/login.png'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const update = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Wire up to your backend / auth service here.
    console.log('Login submitted:', form)
    navigate('/')
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
      panelImageClassName="h-96 object-center"
      panelImageAtBottom
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Email Address">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={update('email')}
            required
          />
        </Field>

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={update('password')}
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

        <Button type="submit" className="w-full justify-center">
          Log In
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
