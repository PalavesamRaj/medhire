import React, { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { fetchCandidatePhoto } from '../../../lib/candidateProfileApi'

function CandidatePhotoImage({ photoUrl, alt, className }) {
  const [resolvedUrl, setResolvedUrl] = useState('')
  const [loading, setLoading] = useState(Boolean(photoUrl))
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    let objectUrl = ''
    setFailed(false)
    if (!photoUrl) {
      setResolvedUrl('')
      setLoading(false)
      return () => { active = false }
    }
    const parsedUrl = new URL(photoUrl, window.location.origin)
    const requiresAuthorization = parsedUrl.pathname === '/api/candidates/me/profile/photo'
    if (!requiresAuthorization) {
      setResolvedUrl(photoUrl)
      setLoading(false)
      return () => { active = false }
    }
    setResolvedUrl('')
    setLoading(true)
    fetchCandidatePhoto(photoUrl).then((url) => {
      objectUrl = url
      if (active) setResolvedUrl(url)
      else URL.revokeObjectURL(url)
    }).catch(() => {
      if (active) setFailed(true)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoUrl])

  if (!resolvedUrl) return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400 ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : 'true'}>
    {loading && !failed ? <span className="sr-only">Loading profile photo</span> : <UserRound className="h-1/2 w-1/2" aria-hidden="true" />}
  </span>
  return <img src={resolvedUrl} alt={alt} className={className} />
}

export default function CandidatePhoto({ photoUrl, alt = '', className = '' }) {
  return <CandidatePhotoImage key={photoUrl || 'no-photo'} photoUrl={photoUrl} alt={alt} className={className} />
}
