import React from 'react'
import Badge from './Badge'

export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <Badge tone="teal" className="mb-4">
          {eyebrow}
        </Badge>
      )}
      <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-ink-600">{subtitle}</p>}
    </div>
  )
}
