import { validatePersonalInformation, validateProfessionalInformation, validateEducation, validateWorkExperience, validateSkills, validateCertifications, validateCareerPreferences } from './candidateProfileValidation.js'

export function hasMoreThanOneYearExperience(value) {
  if (typeof value === 'number') return value > 1
  const text = String(value || '').toLowerCase()
  if (/less than|under|<\s*1|^0(?:\D|$)/.test(text)) return false
  const range = text.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)/)
  if (range) return (Number(range[1]) + Number(range[2])) / 2 > 1
  const amount = text.match(/\d+(?:\.\d+)?/)
  return amount ? Number(amount[0]) > 1 : false
}

const isComplete = (validator, value) => Object.keys(validator(value || (Array.isArray(value) ? [] : {}), true)).length === 0

export function getCandidateProfileCompletion(profile = {}) {
  const professional = profile.professionalInformation || {}
  const experienced = hasMoreThanOneYearExperience(professional.yearsOfExperience)
  const workExperience = profile.workExperience || []
  const certifications = profile.certifications || []
  const sections = [
    { key: 'resume', label: 'Resume Upload', path: '/candidate/profile/resume', optional: true, complete: Boolean(profile.resumeMetadata || profile.resume) },
    { key: 'personalInformation', label: 'Personal Information', path: '/candidate/profile/personal', complete: isComplete(validatePersonalInformation, profile.personalInformation) },
    { key: 'professionalInformation', label: 'Professional Information', path: '/candidate/profile/professional', complete: isComplete(validateProfessionalInformation, professional) },
    { key: 'education', label: 'Education', path: '/candidate/profile/education', complete: isComplete(validateEducation, profile.education || []) },
    { key: 'workExperience', label: 'Work Experience', path: '/candidate/profile/work-experience', optional: !experienced, complete: workExperience.length > 0 && isComplete(validateWorkExperience, workExperience) },
    { key: 'skills', label: 'Skills', path: '/candidate/profile/skills', complete: isComplete(validateSkills, profile.skills || []) },
    { key: 'certifications', label: 'Certifications', path: '/candidate/profile/certifications', optional: true, complete: certifications.length > 0 && isComplete(validateCertifications, certifications) },
    { key: 'careerPreferences', label: 'Career Preferences', path: '/candidate/profile/career-preferences', complete: isComplete(validateCareerPreferences, profile.careerPreferences) },
  ]
  const scoredSections = sections.filter((section) => !section.optional)
  const completeCount = scoredSections.filter((section) => section.complete).length
  return { percentage: Math.round((completeCount / scoredSections.length) * 100), experienced, completeCount, total: scoredSections.length, sections }
}
