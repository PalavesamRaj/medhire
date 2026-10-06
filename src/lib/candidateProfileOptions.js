export const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Self-describe']
export const countryOptions = ['United States', 'India', 'Canada', 'United Kingdom', 'Australia', 'Other']
export const stateOptions = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Other / International']
export const experienceOptions = ['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '11–15 years', '16+ years']
export const degreeOptions = ['Certificate', 'Diploma', 'Associate', 'Bachelor', 'Master', 'Doctorate', 'Other']
export const specialtyOptions = ['Nursing', 'Critical Care', 'Emergency Medicine', 'Primary Care', 'Pediatrics', 'Cardiology', 'Surgery', 'Mental Health', 'Allied Health', 'Other']
export const employmentTypeOptions = ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Per Diem']
export const workSettingOptions = ['Hospital', 'Clinic', 'Home Healthcare', 'Long Term Care', 'Telehealth']
export const shiftOptions = ['Day', 'Night', 'Rotating', 'Flexible']
export const salaryTypeOptions = ['Annual', 'Monthly', 'Hourly']
export const remoteOptions = ['On-site', 'Hybrid', 'Remote', 'No preference']
export const skillCategories = {
  'Clinical Skills': ['Patient Care', 'Critical Care', 'ICU', 'Emergency Care', 'Medication Administration', 'CPR', 'BLS', 'ACLS'],
  'Technical Skills': ['EMR', 'Clinical Documentation', 'Phlebotomy', 'Care Planning'],
  'Soft Skills': ['Communication', 'Empathy', 'Problem Solving', 'Team Leadership'],
}
export const PROFILE_SETUP_STEPS = [
  { step: 1, section: 'resume', name: 'Resume Upload', path: '/candidate/profile/resume', skipTo: '/candidate/profile/personal', subtitle: 'Upload your latest resume to start building your professional profile.' },
  { step: 2, section: 'personalInformation', name: 'Personal Information', path: '/candidate/profile/personal', backTo: '/candidate/profile/resume', skipTo: '/candidate/profile/professional', subtitle: "Let’s start with your basic details" },
  { step: 3, section: 'professionalInformation', name: 'Professional Information', path: '/candidate/profile/professional', backTo: '/candidate/profile/personal', skipTo: '/candidate/profile/education', subtitle: 'Tell us about your healthcare career' },
  { step: 4, section: 'education', name: 'Education', path: '/candidate/profile/education', backTo: '/candidate/profile/professional', skipTo: '/candidate/profile/work-experience', subtitle: 'Add your educational background' },
  { step: 5, section: 'workExperience', name: 'Work Experience', path: '/candidate/profile/work-experience', backTo: '/candidate/profile/education', skipTo: '/candidate/profile/skills', subtitle: 'Share your professional experience' },
  { step: 6, section: 'skills', name: 'Skills', path: '/candidate/profile/skills', backTo: '/candidate/profile/work-experience', skipTo: '/candidate/profile/certifications', subtitle: 'Highlight your professional skills' },
  { step: 7, section: 'certifications', name: 'Certifications', path: '/candidate/profile/certifications', backTo: '/candidate/profile/skills', skipTo: '/candidate/profile/career-preferences', subtitle: 'Add your professional certifications' },
  { step: 8, section: 'careerPreferences', name: 'Career Preferences', path: '/candidate/profile/career-preferences', backTo: '/candidate/profile/certifications', skipTo: '/candidate/profile/complete', subtitle: "Tell us what you’re looking for" },
  { step: 9, section: 'complete', name: 'Profile Setup Complete!', path: '/candidate/profile/complete', backTo: '/candidate/profile/career-preferences', subtitle: 'Congratulations! Your profile is ready.' },
]
export const profileSteps = PROFILE_SETUP_STEPS.map(({ section, name, subtitle }) => [section, name, subtitle])
export const profilePath = (step) => PROFILE_SETUP_STEPS.find((item) => item.step === step)?.path || '/candidate/profile/resume'
