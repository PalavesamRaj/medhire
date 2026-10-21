import React from 'react'

export default function Placeholder({ title }) {
  return (
    <section className="container-page py-32 text-center">
      <h1 className="text-3xl font-extrabold text-ink-900">{title}</h1>
      <p className="mt-3 text-ink-600">This page isn't part of the current build yet.</p>
    </section>
  )
}
