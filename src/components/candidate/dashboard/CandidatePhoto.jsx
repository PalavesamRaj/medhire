import React, { useEffect, useRef, useState } from 'react'
import { fetchCandidatePhoto } from '../../../lib/candidateProfileApi'

function CandidatePhotoImage({ photoUrl, alt, className }) {
  const [fallbackUrl, setFallbackUrl] = useState('')
  const [failed, setFailed] = useState(false)
  const attemptedUrl = useRef('')

  useEffect(() => () => { if (fallbackUrl) URL.revokeObjectURL(fallbackUrl) }, [fallbackUrl])

  const handleError = async () => {
    if (!photoUrl || fallbackUrl || attemptedUrl.current === photoUrl) {
      setFailed(true)
      return
    }
    attemptedUrl.current = photoUrl
    try {
      const objectUrl = await fetchCandidatePhoto(photoUrl)
      if (attemptedUrl.current === photoUrl) setFallbackUrl(objectUrl)
      else URL.revokeObjectURL(objectUrl)
    } catch {
      setFailed(true)
    }
  }

  if (!photoUrl || failed) return null
  return <img src={fallbackUrl || photoUrl} alt={alt} onError={handleError} className={className} />
}

export default function CandidatePhoto({ photoUrl, alt = '', className = '' }) {
  return <CandidatePhotoImage key={photoUrl || 'no-photo'} photoUrl={photoUrl} alt={alt} className={className} />
}
