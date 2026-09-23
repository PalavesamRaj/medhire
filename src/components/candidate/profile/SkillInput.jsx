import React, { useId, useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '../../ui/FormControls'
import Button from '../../ui/Button'

export default function SkillInput({ value = [], onChange, label = 'Search Skills', placeholder = 'Search and add a skill…', categories = {}, error, objectValues = true }) {
  const [query, setQuery] = useState('')
  const id = useId()
  const names = objectValues ? value.map((item) => item.name) : value
  const selected = (name) => names.some((item) => item.toLowerCase() === name.toLowerCase())
  const add = (text) => {
    const name = text.trim().replace(/\s+/g, ' ')
    if (!name || selected(name)) return
    onChange([...value, objectValues ? { name } : name])
    setQuery('')
  }
  return <div className="space-y-4">
    <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</label><div className="flex gap-2"><Input id={id} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(query) } }} placeholder={placeholder} maxLength={80} className="min-w-0 flex-1" error={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /><Button type="button" variant="secondary" disabled={!query.trim() || selected(query.trim().replace(/\s+/g, ' '))} onClick={() => add(query)}>Add</Button></div>{error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>}</div>
    {names.length > 0 && <div><p className="mb-2 text-xs font-semibold text-ink-900">Selected {objectValues ? 'Skills' : label}</p><div className="flex flex-wrap gap-2">{names.map((name, index) => <span key={name} className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-600 bg-brand-50 px-2.5 py-1 text-xs text-brand-600"><span className="break-all">{name}</span><button type="button" aria-label={`Remove ${name}`} className="rounded-full p-1 hover:bg-brand-100 focus-visible:outline focus-visible:outline-2" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}><X size={12} /></button></span>)}</div></div>}
    {Object.entries(categories).map(([category, suggestions]) => {
      const filtered = suggestions.filter((name) => !selected(name) && name.toLowerCase().includes(query.toLowerCase()))
      return filtered.length > 0 && <div key={category}><h3 className="mb-2 text-xs font-semibold text-ink-900">{category}</h3><div className="flex flex-wrap gap-2">{filtered.map((name) => <button type="button" key={name} onClick={() => add(name)} className="rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-600 hover:border-brand-600 hover:bg-brand-50 focus-visible:outline-brand-600">{name}</button>)}</div></div>
    })}
  </div>
}
