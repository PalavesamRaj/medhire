import React from 'react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import ProfileField from '../../../components/candidate/profile/ProfileField'
import SkillInput from '../../../components/candidate/profile/SkillInput'
import useProfileStep from '../../../components/candidate/profile/useProfileStep'
import { validateCareerPreferences } from '../../../lib/candidateProfileValidation'
import { employmentTypeOptions, specialtyOptions, workSettingOptions, shiftOptions, salaryTypeOptions, remoteOptions } from '../../../lib/candidateProfileOptions'

function MultiSelect({ label, options, value = [], onChange, error }) {
  return <fieldset><legend className="mb-2 text-sm font-semibold text-ink-900">{label}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <label key={option} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${value.includes(option) ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-ink-200 text-ink-600'}`}><input type="checkbox" checked={value.includes(option)} onChange={(event) => onChange(event.target.checked ? [...value, option] : value.filter((item) => item !== option))} className="accent-blue-600" />{option}</label>)}</div>{error && <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>}</fieldset>
}
export default function CareerPreferences() {
  const { data, errors, update, submit } = useProfileStep('careerPreferences', 7, validateCareerPreferences)
  const fields = [
    { name: 'workSetting', label: 'Work Setting', options: workSettingOptions },
    { name: 'shiftPreference', label: 'Preferred Shift', options: shiftOptions },
    { name: 'expectedSalary', label: 'Expected Salary (USD)', type: 'number', min: '0.01', step: '0.01', placeholder: '85,000' },
    { name: 'salaryType', label: 'Salary Period', options: salaryTypeOptions },
    { name: 'availableFrom', label: 'Available From', type: 'date' },
    { name: 'remotePreference', label: 'Remote Preference', options: remoteOptions },
  ]
  return <CandidateProfileLayout step={7} onSubmit={submit}>
    <ProfileField name="desiredJobTitle" label="Desired Job Title" placeholder="e.g. ICU Registered Nurse" required value={data.desiredJobTitle} error={errors.desiredJobTitle} onChange={(value) => update('desiredJobTitle', value)} />
    <SkillInput label="Preferred Locations" placeholder="Add a city or region…" objectValues={false} value={data.preferredLocations || []} onChange={(value) => update('preferredLocations', value)} />
    <MultiSelect label="Preferred Specialties" options={specialtyOptions} value={data.preferredSpecialties} onChange={(value) => update('preferredSpecialties', value)} />
    <MultiSelect label="Employment Type *" options={employmentTypeOptions} value={data.employmentTypes} error={errors.employmentTypes} onChange={(value) => update('employmentTypes', value)} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map((field) => <ProfileField key={field.name} {...field} value={data[field.name]} error={errors[field.name]} onChange={(value) => update(field.name, value)} />)}</div>
    <label className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-900">Willing to Relocate<button type="button" role="switch" aria-label="Willing to Relocate" aria-checked={Boolean(data.willingToRelocate)} onClick={() => update('willingToRelocate', !data.willingToRelocate)} className={`relative h-6 w-11 shrink-0 rounded-full focus-visible:outline-brand-600 ${data.willingToRelocate ? 'bg-brand-600' : 'bg-ink-200'}`}><span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${data.willingToRelocate ? 'translate-x-5' : ''}`} /></button></label>
  </CandidateProfileLayout>
}
