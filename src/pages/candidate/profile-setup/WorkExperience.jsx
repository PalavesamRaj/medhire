import React from 'react'
import RepeatableStep from '../../../components/candidate/profile/RepeatableStep'
import WorkExperienceCard from '../../../components/candidate/profile/WorkExperienceCard'
import { validateWorkExperience } from '../../../lib/candidateProfileValidation'
export default function WorkExperience() { return <RepeatableStep section="workExperience" step={5} validate={validateWorkExperience} card={WorkExperienceCard} label="Experience" /> }
