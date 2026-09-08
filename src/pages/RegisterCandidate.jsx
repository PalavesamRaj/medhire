import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import heroImage from '../assets/signup.png'

export default function RegisterCandidate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })

  const update = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.')
      return
    }
    navigate(`/verify-email?role=candidate&email=${encodeURIComponent(form.email)}&source=registration`)
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
      panelImageClassName="h-96 object-center"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Full Name">
          <Input
            placeholder="Enter your full name"
            value={form.name}
            onChange={update('name')}
            required
          />
        </Field>

        <Field label="Email Address">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={update('email')}
            required
          />
        </Field>

        <Field label="Mobile Number">
          <div className="flex overflow-hidden rounded-lg border border-ink-200 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
            <span className="flex items-center border-r border-ink-200 bg-ink-50 px-3.5 text-sm text-ink-500">
              +91
            </span>
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={form.phone}
              onChange={update('phone')}
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
        />

        <PasswordField
          label="Confirm Password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
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

        <Button type="submit" className="w-full justify-center">
          Create Account
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Candidate Login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
