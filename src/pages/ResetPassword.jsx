import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { PasswordField } from '../components/ui/PasswordField'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateResetPassword } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import panelImage from '../assets/resetpass.png'

export default function ResetPassword() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'
  const email = searchParams.get('email') || ''
  const resetToken = searchParams.get('resetToken') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateResetPassword(email, resetToken, password, confirmPassword)
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError(Object.values(validationErrors)[0])
      return
    }

    setFieldErrors({})
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword({ email, resetToken, newPassword: password })
      showToast('Your password has been reset successfully.')
      navigate(`/password-reset-success?role=${role}&email=${encodeURIComponent(email)}`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
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
      panelImageClassName="h-[246px] w-full rounded-t-xl rounded-b-none object-center"
      panelImageContainerClassName="mx-auto w-full rounded-t-xl rounded-b-none"
      panelImageAtBottom
      layoutClassName="lg:grid-cols-[60%_40%]"
      formColumnClassName="lg:px-12"
      formWidthClassName="max-w-[520px]"
      panelClassName="lg:px-12 lg:pt-16"
      panelTitleClassName="text-[28px]"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <PasswordField
          label="New Password"
          placeholder="Create a new password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
          showStrength
          error={fieldErrors.password}
        />
        <PasswordField
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setError('')
          }}
          error={fieldErrors.confirmPassword}
        />
        {error && <p className="-mt-3 text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Resetting...' : 'Reset Password'}
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