import React from 'react'
import RepeatableCard from './RepeatableCard'
import ProfileField from './ProfileField'
import { degreeOptions } from '../../../lib/candidateProfileOptions'

const fields = [
  { name: 'degree', label: 'Degree', options: degreeOptions },
  { name: 'fieldOfStudy', label: 'Field of Study', placeholder: 'e.g. Nursing' },
  { name: 'institutionName', label: 'Institution Name', placeholder: 'School or university' },
  { name: 'graduationYear', label: 'Graduation Year', placeholder: 'YYYY', inputMode: 'numeric', maxLength: 4 },
]
export default function EducationCard({ value, errors = {}, onChange, index, ...props }) {
  return <RepeatableCard title={`Education ${String(index + 1).padStart(2, '0')}`} {...props}>{fields.map((field) => <ProfileField key={field.name} {...field} required value={value[field.name]} error={errors[field.name]} onChange={(next) => onChange({ ...value, [field.name]: next })} />)}</RepeatableCard>
}
