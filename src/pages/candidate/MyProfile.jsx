import React from 'react'
import { Link } from 'react-router-dom'
import { useCandidateDashboard } from '../../context/CandidateDashboardContext'
import ProfileSection from '../../components/candidate/dashboard/ProfileSection'
import StatusBadge from '../../components/candidate/dashboard/StatusBadge'

export default function MyProfile() {
  const { candidate, privacy, resumes } = useCandidateDashboard()
  const professional = candidate.professionalInformation
  const details = [['Years of Experience', professional.yearsOfExperience], ['Current Role', professional.currentJobTitle], ['Employer', professional.currentEmployer], ['Department', professional.specialty], ['License', [professional.licenseNumber, professional.licenseState].filter(Boolean).join(' · ')]]
  return <>
    <header className="flex flex-wrap items-center gap-4"><img src={candidate.photo} alt="" className="h-16 w-16 rounded-full" /><div className="min-w-0 flex-1"><h1 className="med-display-sm">{candidate.firstName} {candidate.lastName}</h1><p className="med-body mt-1 text-ink-600">{candidate.headline || 'Professional title not provided'}</p><p className="med-caption mt-1 text-ink-400">{candidate.location || 'Location not provided'}</p></div><div className="flex flex-wrap items-center gap-3">{privacy.openToWork && <StatusBadge status="Open to Work" />}{resumes.some((resume) => resume.active && resume.status === 'Approved') && <StatusBadge status="Resume Approved" />}<Link to="/candidate/edit-profile" className="med-action">Edit Profile</Link></div></header>
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
