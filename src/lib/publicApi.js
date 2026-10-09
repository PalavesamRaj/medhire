// Unauthenticated endpoints: public job board and the contact form.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function publicRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Something went wrong. Please try again.')
    error.fieldErrors = payload?.error?.fields || {}
    error.status = response.status
    throw error
  }
  return payload
}

export function searchPublicJobs({ q = '', location = '', specialty = '' } = {}, signal) {
  const query = new URLSearchParams()
  if (q) query.set('q', q)
  if (location) query.set('location', location)
  if (specialty) query.set('specialty', specialty)
  query.set('pageSize', '50')
  return publicRequest(`/public/jobs?${query}`, { signal })
}

export const submitContactForm = (form) => publicRequest('/support/tickets', {
  method: 'POST',
  body: JSON.stringify({
    name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() || undefined,
    requesterRole: form.type || 'other', subject: form.subject.trim(), message: form.message.trim(),
    website: form.website || '', // honeypot: real users leave this empty
  }),
})
