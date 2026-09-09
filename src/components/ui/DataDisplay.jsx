import React, { useState } from 'react'
import { Check, X, ChevronDown, Users } from 'lucide-react'
import Badge from './Badge'

export function StatCard({ label, value, delta, positive = true }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-ink-900">{value}</span>
        {delta && (
          <span className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}

const statusTone = {
  Verified: 'success',
  Pending: 'warning',
  Rejected: 'error',
}

export function CandidateTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="px-5 py-3">Candidate</th>
            <th className="px-5 py-3">Specialty</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Match Date</th>
            <th className="px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-ink-100 last:border-0">
              <td className="px-5 py-4 font-semibold text-ink-900">{r.name}</td>
              <td className="px-5 py-4 text-ink-600">{r.specialty}</td>
              <td className="px-5 py-4">
                <Badge tone={statusTone[r.status] === 'success' ? 'success' : statusTone[r.status] === 'warning' ? 'warning' : 'error'}>
                  {r.status}
                </Badge>
              </td>
              <td className="px-5 py-4 text-ink-600">{r.date}</td>
              <td className="px-5 py-4">
                <button className="font-semibold text-brand-600 hover:text-brand-700">Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Avatar({ name, size = 40, src }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700"
    >
      {initials}
    </div>
  )
}

export function AlertBox({ tone = 'success', title, children }) {
  const styles = {
    success: 'bg-green-50 border-green-100 text-green-800',
    error: 'bg-red-50 border-red-100 text-red-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800',
  }
  const Icon = tone === 'error' ? X : Check
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${styles[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {children && <p className="mt-0.5 text-sm opacity-90">{children}</p>}
      </div>
    </div>
  )
}

export function EmptyState({ title = 'No Candidates Found', message }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-ink-200 py-10 text-center">
      <Users className="h-8 w-8 text-ink-300" />
      <p className="font-semibold text-ink-900">{title}</p>
      {message && <p className="max-w-sm text-sm text-ink-400">{message}</p>}
    </div>
  )
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item.q} className="rounded-lg border border-ink-200 bg-ink-50/40">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-ink-900">{item.q}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && <p className="px-5 pb-4 text-xs leading-relaxed text-ink-600">{item.a}</p>}
        </div>
      ))}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-6 border-b border-ink-200">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors
            ${active === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-400 hover:text-ink-600'}`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
