import React from 'react'

const stats = [
  { value: '25,000+', label: 'Healthcare Professionals' },
  { value: '2,500+', label: 'Verified Recruiters' },
  { value: '15,000+', label: 'Jobs Posted' },
  { value: '120+', label: 'Healthcare Roles' },
]

export default function StatsBar() {
  return (
    <section className="border-y border-ink-200 bg-ink-50/60">
      <div className="container-page grid grid-cols-2 divide-x divide-ink-200 py-10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-ink-900">{s.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
