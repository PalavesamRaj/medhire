import React from 'react'

export default function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div
      className={`rounded-xl border border-ink-200 bg-white p-6
        ${hoverable ? 'transition-shadow hover:shadow-md' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
