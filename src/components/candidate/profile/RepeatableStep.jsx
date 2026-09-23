import React, { useEffect } from 'react'
import CandidateProfileLayout from './CandidateProfileLayout'
import useProfileStep from './useProfileStep'
import Button from '../../ui/Button'

export const newProfileEntry = () => ({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` })
export default function RepeatableStep({ section, step, validate, card: Card, label, mandatory = false }) {
  const { data, errors, setErrors, submit, updateSection } = useProfileStep(section, step, validate)
  useEffect(() => {
    if (mandatory && !data.length) updateSection(section, [newProfileEntry()])
  }, [mandatory, data.length, section, updateSection])
  const change = (id, value) => {
    updateSection(section, (rows) => rows.map((row) => row.id === id ? value : row))
    setErrors((previous) => ({ ...previous, [id]: undefined }))
  }
  return <CandidateProfileLayout step={step} onSubmit={submit} error={errors._error}>
    {!mandatory && !data.length && <p className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">No {label.toLowerCase()} added yet. Add an entry below, or continue if this does not apply to you.</p>}
    {data.map((row, index) => <Card key={row.id} value={row} index={index} errors={errors[row.id]} onChange={(value) => change(row.id, value)} removable={!mandatory || data.length > 1} onRemove={() => { updateSection(section, (rows) => rows.filter((item) => item.id !== row.id)); setErrors({}) }} />)}
    <Button type="button" variant="ghost" size="sm" className="!px-0" onClick={() => updateSection(section, (rows) => [...rows, newProfileEntry()])}>+ Add {data.length ? 'Another ' : ''}{label}</Button>
  </CandidateProfileLayout>
}
