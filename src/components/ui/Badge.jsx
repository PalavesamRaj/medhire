import React from 'react'

const toneClasses = {
  blue: 'bg-brand-50 text-brand-700',
  teal: 'bg-accent-50 text-accent-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  slate: 'bg-ink-100 text-ink-600',
}

export default function Badge({ children, tone = 'blue', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide
        ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
