import React from 'react'

export function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-ink-900">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ error = false, className = '', ...props }) {
  return (
    <input
      className={`rounded-lg border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400
        focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600
        disabled:bg-ink-50 disabled:text-ink-400
        ${error ? 'border-red-400' : 'border-ink-200'} ${className}`}
      {...props}
    />
  )
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900
        focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors
          ${checked ? 'bg-accent-500' : 'bg-ink-200'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
      {label && <span className="text-sm text-ink-900">{label}</span>}
    </label>
  )
}

export function Dropzone({ label = 'Drag & drop file', hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 px-6 py-8 text-center">
      <svg className="h-6 w-6 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </div>
  )
}
