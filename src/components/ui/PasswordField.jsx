import React, { useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Field, Input } from './FormControls'

function getStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const labels = ['Weak', 'Fair', 'Good', 'Strong']
const barColors = ['bg-red-500', 'bg-amber-500', 'bg-accent-500', 'bg-green-600']

export function PasswordField({ label, placeholder, value, onChange, showStrength = false }) {
  const [visible, setVisible] = useState(false)
  const strength = useMemo(() => getStrength(value), [value])

  return (
    <Field label={label}>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-1.5">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < strength ? barColors[strength - 1] : 'bg-ink-100'
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Password strength:{' '}
            <span
              className={`font-semibold ${
                strength <= 1 ? 'text-red-600' : strength === 2 ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {labels[Math.max(strength - 1, 0)]}
            </span>
          </p>
        </div>
      )}
    </Field>
  )
}
