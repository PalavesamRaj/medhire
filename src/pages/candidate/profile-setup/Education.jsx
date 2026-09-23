import React from 'react'
import RepeatableStep from '../../../components/candidate/profile/RepeatableStep'
import EducationCard from '../../../components/candidate/profile/EducationCard'
import { validateEducation } from '../../../lib/candidateProfileValidation'
export default function Education() { return <RepeatableStep section="education" step={3} validate={validateEducation} card={EducationCard} label="Education" mandatory /> }
