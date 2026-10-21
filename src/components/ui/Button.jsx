import React from 'react'

const variantClasses = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600 disabled:bg-brand-100 disabled:text-brand-400',
  secondary:
    'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 focus-visible:ring-ink-400',
  outline:
    'bg-transparent text-white border border-white/40 hover:bg-white/10 focus-visible:ring-white',
  ghost: 'bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-600',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  accent: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-600',
}

const sizeClasses = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-5 py-3 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-semibold
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </button>
  )
}
