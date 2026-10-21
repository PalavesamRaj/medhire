import React from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken, getAuthenticatedUser } from '../../lib/authSession'
import { isRecruiterOrganizationApproved } from '../../lib/recruiterAuthApi'

export default function RequireRecruiterAccess({ children, allowPending = false }) {
  const token = getAccessToken()
  const user = getAuthenticatedUser()

  if (!token || !user) return <Navigate to="/login?role=recruiter" replace />
  if (String(user.role || '').toLowerCase() !== 'recruiter') return <Navigate to="/" replace />

  const approved = isRecruiterOrganizationApproved(user)
  if (allowPending && approved) return <Navigate to="/recruiter/dashboard" replace />
  if (!allowPending && !approved) return <Navigate to="/recruiter/verification-pending" replace />

  return children
}
