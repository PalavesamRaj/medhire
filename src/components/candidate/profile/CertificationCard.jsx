import React from 'react'
import RepeatableCard from './RepeatableCard'
import ProfileField from './ProfileField'

export default function CertificationCard({ value, errors = {}, onChange, index, ...props }) {
  const fields = [
    { name: 'certificationName', label: 'Certification Name', placeholder: 'e.g. Basic Life Support (BLS)', wide: true, required: true },
    { name: 'issuingOrganization', label: 'Issuing Organization', placeholder: 'Organization name', wide: true, required: true },
    { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date', disabled: value.doesNotExpire, required: !value.doesNotExpire },
    { name: 'credentialId', label: 'Certification Number', placeholder: 'Credential ID or number', wide: true },
  ]
  return <RepeatableCard title={`Certification ${String(index + 1).padStart(2, '0')}`} {...props}>
    {fields.map((field) => <ProfileField key={field.name} {...field} value={value[field.name]} error={errors[field.name]} onChange={(next) => onChange({ ...value, [field.name]: next })} />)}
    <label className="flex items-center gap-2 text-sm text-ink-600 sm:col-span-2"><input type="checkbox" checked={Boolean(value.doesNotExpire)} onChange={(event) => onChange({ ...value, doesNotExpire: event.target.checked, ...(event.target.checked ? { expiryDate: '' } : {}) })} className="h-4 w-4 accent-blue-600" />This certification does not expire</label>
  </RepeatableCard>
}
