const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\d{10}$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/

export function validateEmail(email) {
  const value = email.trim().toLowerCase()
  return EMAIL_PATTERN.test(value) ? '' : 'Enter a valid email address.'
}

export function validatePassword(password) {
  return PASSWORD_PATTERN.test(password)
    ? ''
    : 'Use 8-72 characters with an uppercase letter, number, and symbol.'
}

function validateRequired(value, label) {
  return value.trim() ? '' : `${label} is required.`
}

export function validateRegistration(form, role) {
  const errors = {}
  const nameError = validateRequired(form.name, role === 'recruiter' ? 'Recruiter name' : 'Full name')
  const emailError = validateEmail(form.email)
  const phoneError = PHONE_PATTERN.test(form.phone.replace(/\D/g, ''))
    ? ''
    : 'Enter a valid 10-digit mobile number.'
  const passwordError = validatePassword(form.password)

  if (nameError) errors.name = nameError
  if (emailError) errors.email = emailError
  if (phoneError) errors.phone = phoneError
  if (passwordError) errors.password = passwordError
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  if (!form.agree) errors.agree = 'Accept the Terms & Conditions and Privacy Policy to continue.'

  if (role === 'recruiter') {
    if (!form.designation.trim()) errors.designation = 'Designation is required.'
    if (!form.orgName.trim()) errors.orgName = 'Organization name is required.'
    if (form.orgWebsite && !/^https?:\/\//i.test(form.orgWebsite.trim())) {
      errors.orgWebsite = 'Use a complete website URL beginning with http:// or https://.'
    }
    if (!form.city.trim()) errors.city = 'City is required.'
    if (!form.state.trim()) errors.state = 'State is required.'
  }

  return errors
}

export function validateLogin(form) {
  const errors = {}
  const emailError = validateEmail(form.email)
  if (emailError) errors.email = emailError
  if (!form.password) errors.password = 'Password is required.'
  return errors
}

export function validateForgotPassword(email) {
  const error = validateEmail(email)
  return error ? { email: error } : {}
}

export function validateVerification(email, code) {
  const errors = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  if (!/^\d{6}$/.test(code)) errors.code = 'Enter the six-digit verification code.'
  return errors
}

export function validateResetPassword(email, resetToken, password, confirmPassword) {
  const errors = {}
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  if (emailError) errors.email = emailError
  if (!resetToken) errors.resetToken = 'This reset session is invalid or has expired. Request a new code.'
  if (passwordError) errors.password = passwordError
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}
