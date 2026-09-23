import React from 'react'
import CandidateProfileLayout from '../../../components/candidate/profile/CandidateProfileLayout'
import SkillInput from '../../../components/candidate/profile/SkillInput'
import useProfileStep from '../../../components/candidate/profile/useProfileStep'
import { validateSkills } from '../../../lib/candidateProfileValidation'
import { skillCategories } from '../../../lib/candidateProfileOptions'
export default function Skills() {
  const { data, errors, setErrors, submit, updateSection } = useProfileStep('skills', 6, validateSkills)
  return <CandidateProfileLayout step={6} onSubmit={submit}><SkillInput value={data} categories={skillCategories} error={errors.skills} onChange={(value) => { updateSection('skills', value); setErrors({}) }} /></CandidateProfileLayout>
}
