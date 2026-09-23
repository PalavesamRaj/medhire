import React, { useId } from 'react'
import { Field, Input, Select } from '../../ui/FormControls'

export default function ProfileField({ name, label, type = 'text', options, value, onChange, error, wide, ...props }) {
  const id = useId()
  const common = { id, name, value: value ?? '', onChange: (event) => onChange(event.target.value), 'aria-label': label, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': error ? `${id}-error` : undefined, className: 'w-full min-w-0 read-only:bg-ink-100', ...props }
  return <div className={wide ? 'sm:col-span-2' : 'min-w-0'}>
    <Field>
      <label htmlFor={id} className="text-sm font-semibold text-ink-900">{label}{props.required && <span aria-hidden="true" className="ml-1 text-brand-600">*</span>}</label>
      {options ? <Select {...common}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</Select>
        : type === 'textarea' ? <textarea {...common} rows={3} className="w-full min-w-0 rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30" />
          : <Input {...common} type={type} error={Boolean(error)} />}
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </Field>
  </div>
}
