import React from 'react'
import RepeatableCard from './RepeatableCard'
import ProfileField from './ProfileField'
import { employmentTypeOptions } from '../../../lib/candidateProfileOptions'

export default function WorkExperienceCard({ value, errors = {}, onChange, index, ...props }) {
  const fields = [
    { name: 'jobTitle', label: 'Job Title', placeholder: 'Your role', required: true },
    { name: 'employerName', label: 'Employer / Hospital', placeholder: 'Organization', required: true },
    { name: 'employmentType', label: 'Employment Type', options: employmentTypeOptions },
    { name: 'location', label: 'Location', placeholder: 'City, State', required: true },
    { name: 'startMonth', label: 'Start Month', type: 'number', min: 1, max: 12, placeholder: 'MM', required: true },
    { name: 'startYear', label: 'Start Year', inputMode: 'numeric', maxLength: 4, placeholder: 'YYYY', required: true },
    { name: 'endMonth', label: 'End Month', type: 'number', min: 1, max: 12, placeholder: 'MM', disabled: value.currentlyWorking, required: !value.currentlyWorking },
    { name: 'endYear', label: 'End Year', inputMode: 'numeric', maxLength: 4, placeholder: 'YYYY', disabled: value.currentlyWorking, required: !value.currentlyWorking },
  ]
  return <RepeatableCard title={`Experience ${String(index + 1).padStart(2, '0')}`} {...props}>
    {fields.map((field) => <ProfileField key={field.name} {...field} value={value[field.name]} error={errors[field.name]} onChange={(next) => onChange({ ...value, [field.name]: next })} />)}
    <label className="flex items-center gap-2 text-sm text-ink-600 sm:col-span-2"><input type="checkbox" checked={Boolean(value.currentlyWorking)} onChange={(event) => onChange({ ...value, currentlyWorking: event.target.checked, ...(event.target.checked ? { endMonth: '', endYear: '' } : {}) })} className="h-4 w-4 accent-blue-600" />Currently working here</label>
    <ProfileField name="description" label="Description" type="textarea" wide placeholder="Describe your responsibilities and impact…" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={3000} />
  </RepeatableCard>
}
