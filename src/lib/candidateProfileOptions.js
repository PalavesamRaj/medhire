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
export const profileSteps = [
  ['personal', 'Personal Information', "Let’s start with your basic details"],
  ['professional', 'Professional Information', 'Tell us about your healthcare career'],
  ['education', 'Education', 'Add your educational background'],
  ['work-experience', 'Work Experience', 'Share your professional experience'],
  ['skills', 'Skills', 'Highlight your professional skills'],
  ['certifications', 'Certifications', 'Add your professional certifications'],
  ['career-preferences', 'Career Preferences', "Tell us what you’re looking for"],
  ['resume', 'Resume Upload', 'Upload your latest resume'],
  ['complete', 'Profile Setup Complete!', 'Congratulations! Your profile is ready.'],
]
export const profilePath = (step) => `/candidate/profile/${profileSteps[step - 1][0]}`
