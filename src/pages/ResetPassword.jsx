import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Check, Eye, EyeOff, Circle } from 'lucide-react'
import Logo from '../components/layout/Logo'
import Button from '../components/ui/Button'
import { authApi } from '../lib/authApi'
import { validateResetPassword } from '../lib/authValidation'
import { useToast } from '../components/ui/ToastProvider'
import resetImage from '../assets/resetpass.png'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const requirements = [
    ['8+ characters', password.length >= 8],
    ['Uppercase', /[A-Z]/.test(password)],
    ['Lowercase', /[a-z]/.test(password)],
    ['Number', /\d/.test(password)],
    ['Special character', /[^A-Za-z0-9]/.test(password)],
  ]
  const strength = requirements.filter(([, met]) => met).length
  const strengthLabel = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'
  const strengthColor = strength <= 1 ? 'text-red-600' : strength === 2 ? 'text-amber-600' : 'text-green-700'

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

  const passwordInput = (value, onChange, visible, setVisible, hasError, placeholder) => (
    <div className={`relative flex h-10 items-center rounded-md border bg-white px-3 ${hasError ? 'border-red-600' : 'border-ink-200'}`}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        required
      />
      <button type="button" onClick={() => setVisible((current) => !current)} className="ml-2 text-ink-400 hover:text-ink-600" aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )

  return (
    <main className="flex min-h-screen bg-ink-50">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-20 lg:py-14">
        <div className="w-full max-w-[520px]">
          <Link to="/" className="mb-7 flex items-center gap-2"><Logo /></Link>
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold text-ink-900">Create New Password</h1>
            <p className="text-sm leading-5 text-ink-600">Create a secure new password for your account.</p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-xs font-semibold text-ink-900">New Password</label>
              {passwordInput(password, (event) => { setPassword(event.target.value); setError('') }, showPassword, setShowPassword, Boolean(fieldErrors.password), 'Create a new password')}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((index) => <span key={index} className={`h-1 flex-1 rounded-sm ${index < Math.min(strength, 4) ? (strength <= 1 ? 'bg-red-600' : strength === 2 ? 'bg-amber-500' : 'bg-green-700') : 'bg-ink-200'}`} />)}
              </div>
              <div className="flex justify-between text-xs"><span className="text-ink-600">Password strength</span><span className={`font-bold ${strengthColor}`}>{password ? strengthLabel : '—'}</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink-900">Password requirements</p>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {requirements.map(([label, met]) => <span key={label} className={`flex w-28 items-center gap-1.5 text-xs ${met ? 'text-green-700' : 'text-ink-600'}`}>{met ? <Check className="h-3.5 w-3.5 font-bold" /> : <Circle className="h-3 w-3" />}{label}</span>)}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-ink-900">Confirm New Password</label>
              {passwordInput(confirmPassword, (event) => { setConfirmPassword(event.target.value); setError('') }, showConfirmPassword, setShowConfirmPassword, Boolean(fieldErrors.confirmPassword), 'Confirm your new password')}
              {fieldErrors.confirmPassword && <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-xs font-semibold">{fieldErrors.confirmPassword ? 'Passwords do not match' : 'Unable to reset password'}</p><p className="mt-0.5 text-xs leading-4">{fieldErrors.confirmPassword ? 'Both password fields must contain the same password.' : error}</p></div></div>}

            <Button type="submit" disabled={loading} className="h-11 w-full justify-center">{loading ? 'Resetting...' : 'Reset Password'}</Button>
          </form>
          </section>
        </div>
      </div>

      <aside className="hidden w-[580px] flex-col gap-10 bg-gradient-to-b from-brand-900 to-ink-900 px-14 pt-20 lg:flex">
        <Logo light />
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold leading-10 text-white">Your Healthcare Career Awaits</h2>
          <ul className="flex flex-col gap-4">
            {['Secure account recovery', 'Your privacy is always protected', 'Trusted by healthcare professionals'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-1 items-end">
          <img src={resetImage} alt="Healthcare professional reviewing a digital patient dashboard" className="h-72 w-full rounded-t-2xl object-cover object-center" />
        </div>
      </aside>
    </main>
  )
}