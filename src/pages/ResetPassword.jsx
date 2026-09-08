import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import panelImage from '../assets/resetpass.png'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'
  const email = searchParams.get('email') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    navigate(`/password-reset-success?role=${role}&email=${encodeURIComponent(email)}`)
  }

  return (
    <AuthSplitLayout
      formTitle="Reset Your Password"
      formSubtitle="Create a new password for your MedHire account."
      panelTitle="Keep Your Account Protected"
      panelPoints={[
        'Use at least eight characters',
        'Combine uppercase, numbers, and symbols',
        'Never share your password with anyone',
      ]}
      panelImage={panelImage}
      panelImageAlt="Security and compliance"
      panelImageClassName="h-96 object-center"
      panelImageAtBottom
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <PasswordField
          label="New Password"
          placeholder="Create a new password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
          showStrength
        />
        <PasswordField
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setError('')
          }}
        />
        {error && <p className="-mt-3 text-xs text-red-600">{error}</p>}
        <Button type="submit" className="w-full justify-center">
          Reset Password
        </Button>
        <p className="text-center text-sm text-ink-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}