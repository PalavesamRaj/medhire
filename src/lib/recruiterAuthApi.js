import { authApi } from './authApi'

function requireRecruiter(response) {
  const user = response?.user
  const role = String(user?.role || response?.role || '').toLowerCase()
  if (role !== 'recruiter') throw new Error('This account is not registered as a recruiter.')
  return { ...response, user: user ? { ...user, role } : { role } }
}

export const recruiterAuthApi = {
  register: (form) => authApi.register({
    role: 'recruiter',
    fullName: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: `+91${form.phone.replace(/\D/g, '')}`,
    designation: form.designation.trim(),
    organizationName: form.orgName.trim(),
    organizationWebsite: form.orgWebsite.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    password: form.password,
    termsAccepted: form.agree,
  }),

  login: async ({ email, password, rememberMe }) => {
    const response = await authApi.login({ email: email.trim().toLowerCase(), password, rememberMe })
    return requireRecruiter(response)
  },

  verifyEmail: async ({ email, code }) => {
    const response = await authApi.verifyCode({ email: email.trim().toLowerCase(), code, purpose: 'registration' })
    if (response?.verified === false) throw new Error(response.message || 'The verification code could not be verified.')
    if (response?.user?.role && String(response.user.role).toLowerCase() !== 'recruiter') {
      throw new Error('This verification code belongs to a different account type.')
    }
    return response
  },

  resendVerification: ({ email }) => authApi.resendCode({ email: email.trim().toLowerCase(), purpose: 'registration' }),
}

export function isRecruiterOrganizationApproved(user) {
  if (user?.organizationVerified === true || user?.isOrganizationVerified === true) return true
  const status = String(user?.organizationVerificationStatus || user?.organizationStatus || user?.verificationStatus || '').toLowerCase()
  return ['approved', 'verified'].includes(status)
}
