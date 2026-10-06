import { VALIDATION_CONFIG } from './validationConfig.js'
import { validateResume } from './candidateProfileValidation.js'

export function validateEditProfile(data) {
  if (!VALIDATION_CONFIG.enabled) return {}
  const errors = {}
  for (const key of ['firstName', 'lastName', 'headline', 'location']) if (!data[key]?.trim()) errors[key] = 'This field is required.'
  if (data.summary?.length > 3000) errors.summary = 'Keep your summary within 3,000 characters.'
  return errors
}
export function validateResumeUpload(file) {
  if (!VALIDATION_CONFIG.enabled) return {}
  return validateResume(file)
}
export function validateApplication(data, resumes, applications, jobId) {
  if (!VALIDATION_CONFIG.enabled) return {}
  const errors = {}
  if (!resumes.some((resume) => resume.id === data.resumeId && resume.status === 'Approved')) errors.resumeId = 'Select an approved resume before applying.'
  if (data.coverNote?.length > 3000) errors.coverNote = 'Keep your cover note within 3,000 characters.'
  if (applications.some((application) => application.jobId === jobId)) errors.application = 'You have already applied for this job.'
  return errors
}
