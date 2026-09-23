import React from 'react'
import RepeatableStep from '../../../components/candidate/profile/RepeatableStep'
import CertificationCard from '../../../components/candidate/profile/CertificationCard'
import { validateCertifications } from '../../../lib/candidateProfileValidation'
export default function Certifications() { return <RepeatableStep section="certifications" step={6} validate={validateCertifications} card={CertificationCard} label="Certification" /> }
