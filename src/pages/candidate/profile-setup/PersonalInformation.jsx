import React, { useEffect } from 'react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import ProfileField from '../../../components/candidate/profile/ProfileField'
import useProfileStep from '../../../components/candidate/profile/useProfileStep'
import { useCandidateProfile } from '../../../context/CandidateProfileContext'
import { validatePersonalInformation } from '../../../lib/candidateProfileValidation'
import { genderOptions, countryOptions, stateOptions } from '../../../lib/candidateProfileOptions'

export default function PersonalInformation() {
  const { data, errors, update, submit, updateSection } = useProfileStep('personalInformation', 2, validatePersonalInformation)
  const { candidate } = useCandidateProfile()
  useEffect(() => {
    if (candidate?.email && data.email !== candidate.email) updateSection('personalInformation', (previous) => ({ ...previous, email: candidate.email }))
  }, [candidate?.email, data.email, updateSection])
  const fields = [
    { name: 'firstName', label: 'First Name', required: true, placeholder: 'Enter first name', autoComplete: 'given-name' },
    { name: 'lastName', label: 'Last Name', required: true, placeholder: 'Enter last name', autoComplete: 'family-name' },
    { name: 'email', label: 'Email', type: 'email', required: true, wide: true, readOnly: Boolean(candidate?.email), autoComplete: 'email', placeholder: 'alex.morgan@email.com' },
    { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true, autoComplete: 'tel', placeholder: '(555) 000-0000' },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, autoComplete: 'bday' },
    { name: 'gender', label: 'Gender', options: genderOptions, required: true },
    { name: 'country', label: 'Country', options: countryOptions, required: true, autoComplete: 'country-name' },
    { name: 'address', label: 'Address', wide: true, placeholder: 'Street address', autoComplete: 'street-address' },
    { name: 'city', label: 'City', required: true, placeholder: 'City', autoComplete: 'address-level2' },
    { name: 'state', label: 'State / Province', options: data.country === 'United States' ? stateOptions : undefined, autoComplete: 'address-level1' },
    { name: 'zipCode', label: 'Zip / Postal Code', autoComplete: 'postal-code', placeholder: 'Postal code' },
  ]
  return <CandidateProfileLayout step={2} onSubmit={submit}><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map((field) => <ProfileField key={field.name} {...field} value={data[field.name]} error={errors[field.name]} onChange={(value) => update(field.name, value)} />)}</div></CandidateProfileLayout>
}
