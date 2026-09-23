import React from 'react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import ProfileField from '../../../components/candidate/profile/ProfileField'
import useProfileStep from '../../../components/candidate/profile/useProfileStep'
import { validateProfessionalInformation } from '../../../lib/candidateProfileValidation'
import { experienceOptions, specialtyOptions, stateOptions } from '../../../lib/candidateProfileOptions'

const fields = [
  { name: 'currentJobTitle', label: 'Current Job Title / Headline', placeholder: 'e.g. Registered Nurse — Critical Care', wide: true, required: true },
  { name: 'yearsOfExperience', label: 'Years of Experience', options: experienceOptions, required: true },
  { name: 'currentEmployer', label: 'Current Employer / Hospital', placeholder: 'Organization name' },
  { name: 'specialty', label: 'Department / Specialty', options: specialtyOptions, wide: true, required: true },
  { name: 'licenseNumber', label: 'License Number', placeholder: 'License number' },
  { name: 'licenseState', label: 'License State', options: stateOptions },
  { name: 'npiNumber', label: 'NPI Number', inputMode: 'numeric', maxLength: 10, placeholder: '10-digit NPI number', wide: true },
  { name: 'professionalSummary', label: 'Professional Summary', type: 'textarea', placeholder: 'Describe your experience, focus, and approach to patient care…', wide: true, maxLength: 3000 },
]
export default function ProfessionalInformation() {
  const { data, errors, update, submit } = useProfileStep('professionalInformation', 3, validateProfessionalInformation)
  return <CandidateProfileLayout step={3} onSubmit={submit}><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map((field) => <ProfileField key={field.name} {...field} value={data[field.name]} error={errors[field.name]} onChange={(value) => update(field.name, field.name === 'npiNumber' ? value.replace(/\D/g, '').slice(0, 10) : value)} />)}</div></CandidateProfileLayout>
}
