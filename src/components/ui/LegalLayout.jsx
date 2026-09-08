import React, { useEffect, useRef, useState } from 'react'
import Badge from './Badge'

export default function LegalLayout({ eyebrow, title, updated, updatedLine, intro, sections }) {
  const [active, setActive] = useState(sections[0]?.id)
  const refs = useRef({})

  useEffect(() => {
    window.scrollTo(0, 0)
    setActive(sections[0]?.id)
  }, [sections])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    Object.values(refs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  const scrollTo = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="bg-ink-50/60 py-16">
        <div className="container-page">
          {updated && (
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Last updated: {updated}
            </span>
          )}
          {eyebrow && <Badge tone="teal">{eyebrow}</Badge>}
          <h1 className="mt-4 text-4xl font-extrabold text-ink-900 sm:text-5xl">{title}</h1>
          {updatedLine && <p className="mt-3 text-sm text-ink-500">{updatedLine}</p>}
          {intro && <p className="mt-4 max-w-3xl text-ink-600">{intro}</p>}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <nav className="hidden lg:block">
            <ul className="sticky top-24 flex flex-col gap-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors
                      ${active === s.id
                        ? 'border-l-2 border-brand-600 bg-brand-50 font-semibold text-brand-700'
                        : 'border-l-2 border-transparent text-ink-500 hover:text-ink-900'}`}
                  >
                    <span className="font-mono text-xs text-brand-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-10 rounded-xl border border-ink-200 bg-white p-6 sm:p-10">
            {sections.map((s, i) => (
              <div
                key={s.id}
                id={s.id}
                ref={(el) => (refs.current[s.id] = el)}
                className="scroll-mt-24 border-b border-ink-100 pb-8 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-brand-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-xl font-bold text-ink-900">{s.title}</h2>
                </div>
                <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink-600">
                  {s.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
