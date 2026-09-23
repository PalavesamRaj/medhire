import { VALIDATION_CONFIG } from './validationConfig.js'
const present = (value) => typeof value === 'string' ? Boolean(value.trim()) : value != null && value !== ''
const required = (data, fields) => Object.fromEntries(fields.filter((key) => !present(data?.[key])).map((key) => [key, 'This field is required.']))
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const today = () => new Date().toISOString().slice(0, 10)
export function validatePersonalInformation(data = {}) {
  if (!VALIDATION_CONFIG.enabled) return {}
  const errors = required(data, ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'country', 'city'])
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.'
  if (data.phoneNumber && (!/^[+\d\s().-]+$/.test(data.phoneNumber) || !/^\d{7,15}$/.test(data.phoneNumber.replace(/\D/g, '')))) errors.phoneNumber = 'Enter a valid phone number (7–15 digits).'
  if (data.dateOfBirth && (!validDate(data.dateOfBirth) || data.dateOfBirth >= today() || Number(data.dateOfBirth.slice(0, 4)) < 1900)) errors.dateOfBirth = 'Enter a valid date of birth in the past.'
  return errors
}
export function validateProfessionalInformation(data = {}) {
  if (!VALIDATION_CONFIG.enabled) return {}
  const errors = required(data, ['currentJobTitle', 'yearsOfExperience', 'specialty'])
  if (data.npiNumber && !/^\d{10}$/.test(data.npiNumber)) errors.npiNumber = 'NPI must contain exactly 10 digits.'
  return errors
}
function validateRows(rows, validate, mandatory = false) {
  if (!Array.isArray(rows) || (mandatory && !rows.length)) return { _error: 'Add at least one entry.' }
  return rows.reduce((errors, row, index) => {
    const rowErrors = validate(row)
    if (Object.keys(rowErrors).length) errors[row.id || index] = rowErrors
    return errors
  }, {})
}
export function validateEducation(rows) {
  if (!VALIDATION_CONFIG.enabled) return {}
  return validateRows(rows, (row) => {
    const errors = required(row, ['degree', 'fieldOfStudy', 'institutionName', 'graduationYear'])
    if (row.graduationYear && (!/^\d{4}$/.test(row.graduationYear) || +row.graduationYear < 1900 || +row.graduationYear > new Date().getFullYear() + 10)) errors.graduationYear = 'Enter a four-digit year between 1900 and ten years from now.'
    return errors
  }, true)
}
const validMonth = (month, year) => /^(0?[1-9]|1[0-2])$/.test(month || '') && /^\d{4}$/.test(year || '') && +year >= 1900 && +year <= new Date().getFullYear() + 10
export function validateWorkExperience(rows) {
  if (!VALIDATION_CONFIG.enabled) return {}
  return validateRows(rows, (row) => {
    const errors = required(row, ['jobTitle', 'employerName', 'location', 'startMonth', 'startYear', ...(!row.currentlyWorking ? ['endMonth', 'endYear'] : [])])
    if (!validMonth(row.startMonth, row.startYear)) errors.startYear = 'Enter a valid start month and year.'
    else if (new Date(+row.startYear, +row.startMonth - 1) > new Date()) errors.startYear = 'Start date cannot be in the future.'
    if (!row.currentlyWorking) {
      if (!validMonth(row.endMonth, row.endYear)) errors.endYear = 'Enter a valid end month and year.'
      else if (+row.endYear * 12 + +row.endMonth < +row.startYear * 12 + +row.startMonth) errors.endYear = 'End date must be on or after the start date.'
      else if (new Date(+row.endYear, +row.endMonth - 1) > new Date()) errors.endYear = 'End date cannot be in the future.'
    }
    return errors
  })
}
export function validateSkills(skills) {
  if (!VALIDATION_CONFIG.enabled) return {}
  if (!Array.isArray(skills) || !skills.length) return { skills: 'Add at least one skill.' }
  const names = skills.map((skill) => String(skill.name || '').trim().toLowerCase())
  return names.some((name) => !name || name.length > 80) || new Set(names).size !== names.length ? { skills: 'Use unique skills of 1–80 characters.' } : {}
}
export function validateCertifications(rows) {
  if (!VALIDATION_CONFIG.enabled) return {}
  return validateRows(rows, (row) => {
    const errors = required(row, ['certificationName', 'issuingOrganization', 'issueDate', ...(!row.doesNotExpire ? ['expiryDate'] : [])])
    if (row.issueDate && (!validDate(row.issueDate) || row.issueDate > today())) errors.issueDate = 'Enter a valid issue date, today or earlier.'
    if (!row.doesNotExpire && row.expiryDate && (!validDate(row.expiryDate) || row.expiryDate < row.issueDate)) errors.expiryDate = 'Expiry date must be on or after the issue date.'
    return errors
  })
}
export function validateCareerPreferences(data = {}) {
  if (!VALIDATION_CONFIG.enabled) return {}
  const errors = required(data, ['desiredJobTitle'])
  if (!Array.isArray(data.employmentTypes) || !data.employmentTypes.length) errors.employmentTypes = 'Choose at least one employment type.'
  if (present(data.expectedSalary) && (!/^\d+(\.\d{1,2})?$/.test(String(data.expectedSalary)) || +data.expectedSalary <= 0)) errors.expectedSalary = 'Enter a positive salary amount.'
  if (present(data.expectedSalary) && !data.salaryType) errors.salaryType = 'Choose a salary period.'
  if (data.availableFrom && !validDate(data.availableFrom)) errors.availableFrom = 'Enter a valid availability date.'
  return errors
}
export function validateResume(file) {
  if (!VALIDATION_CONFIG.enabled) return {}
  if (!file) return { resume: 'Select your resume to continue. After refreshing, please select the file again.' }
  if (!/\.(pdf|doc|docx)$/i.test(file.name || '')) return { resume: 'Choose a PDF, DOC, or DOCX file.' }
  if (!file.size) return { resume: 'The selected file is empty.' }
  if (file.size > 5 * 1024 * 1024) return { resume: 'Your resume must be 5 MB or smaller.' }
  return {}
}
export const profileValidators = [validatePersonalInformation, validateProfessionalInformation, validateEducation, validateWorkExperience, validateSkills, validateCertifications, validateCareerPreferences, validateResume]
export const profileSections = ['personalInformation', 'professionalInformation', 'education', 'workExperience', 'skills', 'certifications', 'careerPreferences', 'resume']
