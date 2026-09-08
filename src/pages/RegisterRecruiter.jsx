import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Info, ArrowRight } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { Field, Input } from '../components/ui/FormControls'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import panelImage from '../assets/recruiter-candidate-grid.png'

export default function RegisterRecruiter() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    orgName: '',
    orgWebsite: '',
    city: '',
    state: '',
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
    navigate(`/verify-email?role=recruiter&email=${encodeURIComponent(form.email)}&source=registration`)
  }

  return (
    <AuthSplitLayout
      formTitle="Create Your Recruiter Account"
      formSubtitle="Start hiring verified healthcare professionals today."
      panelTitle="Hire Healthcare Talent Faster"
      panelPoints={[
        'Access verified, pre-screened healthcare candidates',
        'Advanced search by specialty, registry license, and location',
        'Credit-based matching — pay only for candidate details you unlock',
      ]}
      panelImage={panelImage}
      panelImageAlt="Recruiting team reviewing candidates"
      panelImageClassName="h-96 object-center"
      panelFooter="Institution Grade security. Fully HIPAA & Medical Council compliant."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Recruiter Name">
            <Input
              placeholder="Enter your full name"
              value={form.name}
              onChange={update('name')}
              required
            />
          </Field>
          <Field label="Official Work Email">
            <Input
              type="email"
              placeholder="Enter your work email"
              value={form.email}
              onChange={update('email')}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone Number">
            <div className="flex overflow-hidden rounded-lg border border-ink-200 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
              <span className="flex items-center border-r border-ink-200 bg-ink-50 px-3.5 text-sm text-ink-500">
                +91
              </span>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={update('phone')}
                className="flex-1 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                required
              />
            </div>
          </Field>
          <Field label="Designation">
            <Input
              placeholder="e.g. HR Manager, Talent Acquisition Lead"
              value={form.designation}
              onChange={update('designation')}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Hospital / Organization Name">
            <Input
              placeholder="Enter hospital or organization name"
              value={form.orgName}
              onChange={update('orgName')}
              required
            />
          </Field>
          <Field label="Hospital Website">
            <Input
              placeholder="e.g. www.hospital.com"
              value={form.orgWebsite}
              onChange={update('orgWebsite')}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City">
            <Input placeholder="Select city" value={form.city} onChange={update('city')} required />
          </Field>
          <Field label="State">
            <Input placeholder="Select state" value={form.state} onChange={update('state')} required />
          </Field>
        </div>

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

        <div className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Recruiter accounts require verification before accessing candidate profiles. Our team
            will verify your organization within 24-48 business hours.
          </p>
        </div>

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

        <Button type="submit" icon={ArrowRight} className="w-full justify-center">
          Create Recruiter Account
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Recruiter Login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
