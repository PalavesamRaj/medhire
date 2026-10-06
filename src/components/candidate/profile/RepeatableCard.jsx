import React from 'react'
import Button from '../../ui/Button'

export default function RepeatableCard({ title, removable, onRemove, children }) {
  return <fieldset className="min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-4 sm:p-5">
    <legend className="sr-only">{title}</legend>
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-ink-900">{title}</h2>{removable && <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${title}`}>Remove</Button>}</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>
}
