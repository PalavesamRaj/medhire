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
      <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-ink-600">{subtitle}</p>}
    </div>
  )
}
