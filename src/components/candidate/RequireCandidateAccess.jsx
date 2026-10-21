import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getAuthenticatedUser } from '../../lib/authSession'

// Navigation guard only. The backend remains the real authorization boundary.
export default function RequireCandidateAccess({ children }) {
  const location = useLocation()
  const token = getAccessToken()
  const user = getAuthenticatedUser()
  if (!token || !user) return <Navigate to="/login?role=candidate" replace state={{ from: location.pathname }} />
  const role = String(user.role || '').toLowerCase()
  if (role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />
  if (role !== 'candidate') return <Navigate to="/" replace />
  return children
}
