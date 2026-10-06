import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import ProfileSection from '../../components/candidate/dashboard/ProfileSection'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'
import { useToast } from '../../components/ui/ToastProvider'
import { candidateProfileApi } from '../../lib/candidateProfileApi'

export default function MyProfile() {
  const { candidate, privacy, resumes, dispatch } = useCandidateDashboard()
  const photoInput = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const toast = useToast()
  const professional = candidate.professionalInformation
  const details = [['Years of Experience', professional.yearsOfExperience], ['Current Role', professional.currentJobTitle], ['Employer', professional.currentEmployer], ['Department', professional.specialty], ['License', [professional.licenseNumber, professional.licenseState].filter(Boolean).join(' · ')]]
  const uploadPhoto = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setPhotoError('Choose an image up to 5 MB.'); return }
    setPhotoBusy(true); setPhotoError('')
    try {
      const response = await candidateProfileApi.uploadProfilePhoto(file)
      const data = response?.data || response || {}
      const photo = data.photoUrl || data.profilePhotoUrl || data.avatarUrl || data.url
      if (!photo) throw new Error('The profile service did not return the new photo URL.')
      dispatch({ type: 'edit', data: { photo } })
      toast('Profile photo updated.')
    } catch (error) { setPhotoError(error.message || 'Unable to upload your profile photo.') }
    finally { setPhotoBusy(false) }
  }
  return <>
    <header className="flex flex-wrap items-center gap-4"><div className="flex flex-col items-center gap-2"><button type="button" onClick={() => photoInput.current?.click()} disabled={photoBusy} aria-label="Upload profile photo" className="relative h-16 w-16 overflow-hidden rounded-full bg-ink-100 text-xs text-brand-600 hover:ring-2 hover:ring-brand-600">{candidate.photo ? <img src={candidate.photo} alt="Profile" className="h-full w-full object-cover" /> : 'Add photo'}</button><input ref={photoInput} type="file" accept="image/*" className="sr-only" aria-label="Choose profile photo" onChange={(event) => { uploadPhoto(event.target.files?.[0]); event.target.value = '' }} /><span className="med-caption text-ink-400">{photoBusy ? 'Uploading…' : 'Change photo'}</span></div><div className="min-w-0 flex-1"><h1 className="med-display-sm">{candidate.firstName} {candidate.lastName}</h1><p className="med-body mt-1 text-ink-600">{candidate.headline || 'Professional title not provided'}</p><p className="med-caption mt-1 text-ink-400">{candidate.location || 'Location not provided'}</p></div><div className="flex flex-wrap items-center gap-3">{privacy.openToWork && <StatusBadge status="Open to Work" />}{resumes.some((resume) => resume.active && resume.status === 'Approved') && <StatusBadge status="Resume Approved" />}<Link to="/candidate/edit-profile" className="med-action">Edit Profile</Link></div></header>
    {photoError && <p role="alert" className="med-body text-red-600">{photoError}</p>}
    <div className="space-y-4 rounded-xl border border-ink-200 p-3 sm:p-5">
      <ProfileSection title="About"><p className="med-body text-ink-600">{candidate.summary || 'Add a summary to introduce your experience and approach to care.'}</p></ProfileSection>
      <ProfileSection title="Professional Details"><dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="med-caption text-ink-600">{label}</dt><dd className="med-body mt-1 font-semibold">{value || 'Not provided'}</dd></div>)}</dl></ProfileSection>
      <ProfileSection title="Work Experience"><div className="space-y-4">{candidate.workExperience.length ? candidate.workExperience.map((entry) => <div key={entry.id}><h3 className="med-body font-semibold">{entry.jobTitle}</h3><p className="med-body text-ink-600">{entry.employerName}</p><p className="med-caption mt-1 text-ink-400">{entry.startYear}–{entry.currentlyWorking ? 'Present' : entry.endYear}</p>{entry.description && <p className="med-body mt-2 text-ink-600">{entry.description}</p>}</div>) : <p className="med-body text-ink-600">No work experience added yet.</p>}</div></ProfileSection>
      <ProfileSection title="Education"><div className="space-y-4">{candidate.education.length ? candidate.education.map((entry) => <div key={entry.id}><h3 className="med-body font-semibold">{entry.degree}, {entry.fieldOfStudy}</h3><p className="med-body text-ink-600">{entry.institutionName}</p><p className="med-caption mt-1 text-ink-400">{entry.graduationYear}</p></div>) : <p className="med-body text-ink-600">No education added yet.</p>}</div></ProfileSection>
      <ProfileSection title="Skills"><div className="flex flex-wrap gap-2">{candidate.skills.length ? candidate.skills.map((skill) => <StatusBadge key={skill.name} status={skill.name} />) : <p className="med-body text-ink-600">No skills added yet.</p>}</div></ProfileSection>
      <ProfileSection title="Certifications"><div className="space-y-4">{candidate.certifications.length ? candidate.certifications.map((entry) => <div key={entry.id}><h3 className="med-body font-semibold">{entry.certificationName}</h3><p className="med-body text-ink-600">{entry.issuingOrganization}</p><p className="med-caption mt-1 text-ink-400">{entry.doesNotExpire ? 'Does not expire' : `Expires ${entry.expiryDate || 'Not provided'}`}</p></div>) : <p className="med-body text-ink-600">No certifications added yet.</p>}</div></ProfileSection>
    </div>
  </>
}
