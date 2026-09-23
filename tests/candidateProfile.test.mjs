import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { validatePersonalInformation, validateProfessionalInformation, validateEducation, validateWorkExperience, validateSkills, validateCertifications, validateCareerPreferences, validateResume } from '../src/lib/candidateProfileValidation.js'
import { loadProfileDraft, saveProfileDraft, clearProfileDraft, PROFILE_DRAFT_KEY } from '../src/lib/candidateProfileDraft.js'
import { profilePath, profileSteps } from '../src/lib/candidateProfileOptions.js'

const personal = { firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.com', phoneNumber: '+1 (555) 123-4567', dateOfBirth: '1994-04-19', gender: 'Female', country: 'United States', city: 'Boston' }
test('personal information: required fields, email, phone and valid past birth date', () => {
  assert.deepEqual(validatePersonalInformation(personal), {})
  assert.equal(Object.keys(validatePersonalInformation({})).length, 8)
  for (const dateOfBirth of ['2099-01-01', '2023-02-29', 'bad']) assert.ok(validatePersonalInformation({ ...personal, dateOfBirth }).dateOfBirth)
  assert.ok(validatePersonalInformation({ ...personal, email: 'bad', phoneNumber: 'abc1234567' }).email)
  assert.ok(validatePersonalInformation({ ...personal, phoneNumber: 'abc1234567' }).phoneNumber)
})
test('professional information: optional NPI is numeric and exactly ten digits', () => {
  const data = { currentJobTitle: 'Nurse', yearsOfExperience: '3–5 years', specialty: 'Nursing' }
  assert.deepEqual(validateProfessionalInformation(data), {})
  assert.deepEqual(validateProfessionalInformation({ ...data, npiNumber: '0123456789' }), {})
  assert.ok(validateProfessionalInformation({ ...data, npiNumber: '123abc' }).npiNumber)
})
test('education requires an entry and validates graduation year', () => {
  assert.ok(validateEducation([])._error)
  const row = { id: 'a', degree: 'Bachelor', fieldOfStudy: 'Nursing', institutionName: 'University', graduationYear: '2020' }
  assert.deepEqual(validateEducation([row]), {})
  assert.ok(validateEducation([{ ...row, graduationYear: '20' }]).a.graduationYear)
})
test('experience supports no previous employment and validates chronology', () => {
  assert.deepEqual(validateWorkExperience([]), {})
  const row = { id: 'a', jobTitle: 'Nurse', employerName: 'Hospital', location: 'Boston', startMonth: '02', startYear: '2020', endMonth: '01', endYear: '2019' }
  assert.ok(validateWorkExperience([row]).a.endYear)
  assert.deepEqual(validateWorkExperience([{ ...row, currentlyWorking: true }]), {})
  assert.ok(validateWorkExperience([{ ...row, currentlyWorking: true, startYear: '2099' }]).a.startYear)
})
test('skills require a nonempty selection without case-insensitive duplicates', () => {
  assert.ok(validateSkills([]).skills)
  assert.deepEqual(validateSkills([{ name: 'Patient Care' }]), {})
  assert.ok(validateSkills([{ name: 'CPR' }, { name: 'cpr' }]).skills)
})
test('certification dates and no-expiry toggle', () => {
  const row = { id: 'a', certificationName: 'BLS', issuingOrganization: 'Organization', issueDate: '2024-01-01', expiryDate: '2023-01-01' }
  assert.ok(validateCertifications([row]).a.expiryDate)
  assert.deepEqual(validateCertifications([{ ...row, doesNotExpire: true }]), {})
  assert.deepEqual(validateCertifications([]), {})
})
test('career preferences validate employment selection and salary', () => {
  const data = { desiredJobTitle: 'Nurse', employmentTypes: ['Full Time'] }
  assert.deepEqual(validateCareerPreferences(data), {})
  assert.ok(validateCareerPreferences({ ...data, expectedSalary: '-1' }).expectedSalary)
  assert.ok(validateCareerPreferences({ ...data, expectedSalary: '85000' }).salaryType)
})
test('resume accepts supported files up to 5 MB and rejects empty/invalid files', () => {
  for (const name of ['resume.PDF', 'resume.doc', 'resume.docx']) assert.deepEqual(validateResume({ name, size: 5 * 1024 * 1024 }), {})
  for (const file of [null, { name: 'file.exe', size: 10 }, { name: 'file.pdf', size: 0 }, { name: 'file.pdf', size: 5 * 1024 * 1024 + 1 }]) assert.ok(validateResume(file).resume)
})
test('profile setup order starts with resume upload for new candidates', () => {
  assert.deepEqual(profileSteps.map(([section]) => section), ['resume', 'personalInformation', 'professionalInformation', 'education', 'workExperience', 'skills', 'certifications', 'careerPreferences', 'complete'])
  assert.equal(profilePath(1), '/candidate/profile/resume')
  assert.equal(profilePath(2), '/candidate/profile/personal')
  assert.equal(profilePath(9), '/candidate/profile/complete')
})
test('draft round trip omits File data and tolerates invalid or unavailable storage', () => {
  const entries = new Map()
  globalThis.sessionStorage = { getItem: (key) => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) }
  assert.equal(saveProfileDraft({ ...loadProfileDraft(), personalInformation: personal, resume: { name: 'resume.pdf' } }), true)
  assert.equal(JSON.parse(entries.get(PROFILE_DRAFT_KEY)).resume, undefined)
  assert.deepEqual(loadProfileDraft().personalInformation, personal)
  assert.equal(loadProfileDraft().resume, null)
  clearProfileDraft()
  assert.equal(entries.has(PROFILE_DRAFT_KEY), false)
  entries.set(PROFILE_DRAFT_KEY, '{bad')
  assert.deepEqual(loadProfileDraft().education, [])
  globalThis.sessionStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  assert.equal(saveProfileDraft({}), false)
  assert.equal(clearProfileDraft(), false)
  assert.equal(loadProfileDraft().resume, null)
})
test('API adapter sends bearer auth, JSON sections and multipart final submission; surfaces failure', async () => {
  const result = await build({ entryPoints: ['src/lib/candidateProfileApi.js'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.VITE_API_BASE_URL': '"https://profile.test/api"' } })
  const api = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
  const oldFetch = globalThis.fetch
  globalThis.localStorage = { getItem: () => 'test-token' }
  let call
  globalThis.fetch = async (url, options) => { call = { url, ...options }; return { ok: true, status: 200, json: async () => ({ success: true }) } }
  try {
    await api.savePersonalInformation(personal)
    assert.equal(call.url, 'https://profile.test/api/candidate/profile/personal')
    assert.equal(call.headers.Authorization, 'Bearer test-token')
    assert.deepEqual(JSON.parse(call.body), personal)
    await api.submitCandidateProfile({ personalInformation: personal, resume: new Blob(['resume'], { type: 'application/pdf' }) })
    assert.ok(call.body instanceof FormData)
    assert.equal(call.headers['Content-Type'], undefined)
    assert.deepEqual(JSON.parse(call.body.get('profile')), { personalInformation: personal })
    assert.ok(call.body.get('resume'))
    globalThis.fetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'Invalid profile' }) })
    await assert.rejects(api.submitCandidateProfile({}), /Invalid profile/)
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new Error('HTML') } })
    await assert.rejects(api.submitCandidateProfile({}), /unexpected response/)
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await assert.rejects(api.submitCandidateProfile({}), /Unable to connect/)
  } finally { globalThis.fetch = oldFetch }
})
