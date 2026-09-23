import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { VALIDATION_CONFIG } from '../src/lib/validationConfig.js'
import { validateEditProfile, validateResumeUpload, validateApplication } from '../src/lib/candidateDashboardValidation.js'
import { profileValidators } from '../src/lib/candidateProfileValidation.js'

async function bundle(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.VITE_API_BASE_URL': '"https://candidate.test/api"' }, plugins: [{ name: 'test-assets', setup(build) { build.onLoad({ filter: /\.svg$/ }, () => ({ contents: 'export default "/test-avatar.svg"', loader: 'js' })) } }] })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const state = await bundle('src/lib/candidateDashboardState.js')
const blankProfile = { personalInformation: {}, professionalInformation: {}, education: [], workExperience: [], skills: [], certifications: [], careerPreferences: {}, resume: null }

test('one switch bypasses all dashboard and onboarding validators', () => {
  VALIDATION_CONFIG.enabled = false
  try {
    for (const validator of profileValidators) assert.deepEqual(validator(), {})
    assert.deepEqual(validateEditProfile({}), {})
    assert.deepEqual(validateResumeUpload({ name: 'bad.exe', size: 99999999 }), {})
    assert.deepEqual(validateApplication({}, [], [{ jobId: 'job' }], 'job'), {})
  } finally { VALIDATION_CONFIG.enabled = true }
  assert.ok(validateEditProfile({}).firstName)
  assert.ok(validateResumeUpload({ name: 'bad.exe', size: 30 }).resume)
})
test('edit validation checks required values and summary length', () => {
  const profile = { firstName: 'Alex', lastName: 'Morgan', headline: 'Nurse', location: 'Boston', summary: '' }
  assert.deepEqual(validateEditProfile(profile), {})
  assert.ok(validateEditProfile({ ...profile, headline: ' ' }).headline)
  assert.ok(validateEditProfile({ ...profile, summary: 'a'.repeat(3001) }).summary)
})
test('applications require an approved resume and reject duplicates', () => {
  const resumes = [{ id: 'approved', status: 'Approved' }, { id: 'pending', status: 'Pending Review' }]
  assert.deepEqual(validateApplication({ resumeId: 'approved' }, resumes, [], 'job'), {})
  assert.ok(validateApplication({ resumeId: 'pending' }, resumes, [], 'job').resumeId)
  assert.ok(validateApplication({ resumeId: 'approved' }, resumes, [{ jobId: 'job' }], 'job').application)
})
test('onboarding data replaces the demo identity and does not inherit demo history', () => {
  assert.equal(state.candidateFromProfile(blankProfile).firstName, 'Sarah')
  const own = { ...blankProfile, personalInformation: { firstName: 'Alex', lastName: 'Morgan', city: 'Boston' }, professionalInformation: { currentJobTitle: 'RN' }, education: [{ id: 'a', degree: 'BSN' }] }
  assert.equal(state.candidateFromProfile(own).firstName, 'Alex')
  assert.equal(state.candidateFromProfile(own).headline, 'RN')
  assert.equal(state.candidateFromProfile(own).education[0].degree, 'BSN')
  const result = state.createDashboardState(own)
  assert.deepEqual(result.applications, [])
  assert.deepEqual(result.resumes, [])
})
test('combined job filters are case insensitive and restrictive', () => {
  const initial = state.createDashboardState(blankProfile)
  assert.equal(state.filterJobs(initial.jobs, { q: ' icu ' }).length, 2)
  assert.equal(state.filterJobs(initial.jobs, { q: 'icu', type: 'Contract' }).length, 1)
  assert.equal(state.filterJobs(initial.jobs, { location: 'new york', specialty: 'Critical Care' }).length, 1)
  assert.equal(state.filterJobs(initial.jobs, { hospital: 'missing' }).length, 0)
})
test('saved jobs toggle without duplicates and leave original state untouched', () => {
  const initial = state.createDashboardState(blankProfile)
  const next = state.dashboardReducer(initial, { type: 'save-job', id: 'new-job' })
  assert.equal(next.savedJobIds.length, initial.savedJobIds.length + 1)
  assert.equal(initial.savedJobIds.includes('new-job'), false)
  assert.deepEqual(state.dashboardReducer(next, { type: 'save-job', id: 'new-job' }).savedJobIds, initial.savedJobIds)
})
test('pending resumes never replace the active resume; activation is exclusive', () => {
  const initial = state.createDashboardState(blankProfile)
  const pending = state.dashboardReducer(initial, { type: 'add-resume', resume: { id: 'pending', status: 'Pending Review', active: false } })
  assert.equal(pending.resumes.filter((resume) => resume.active).length, 1)
  assert.equal(state.dashboardReducer(pending, { type: 'activate-resume', id: 'pending' }), pending)
  const approved = state.dashboardReducer(pending, { type: 'add-resume', resume: { id: 'approved', status: 'Approved', active: false } })
  const next = state.dashboardReducer(approved, { type: 'activate-resume', id: 'approved' })
  assert.deepEqual(next.resumes.filter((resume) => resume.active).map((resume) => resume.id), ['approved'])
})
test('application submission updates the shared application list and activity', () => {
  const initial = state.createDashboardState(blankProfile)
  const next = state.dashboardReducer(initial, { type: 'apply', application: { id: 'new', jobId: 'job', status: 'Applied' }, activity: { id: 'new-activity' } })
  assert.equal(next.applications.length, initial.applications.length + 1)
  assert.equal(next.activities[0].id, 'new-activity')
})
test('dashboard API encodes paths and queries, adds auth and uses multipart for files', async () => {
  const api = await bundle('src/lib/candidateDashboardApi.js')
  const originalFetch = globalThis.fetch
  globalThis.localStorage = { getItem: () => 'candidate-token' }
  let request
  globalThis.fetch = async (url, options) => { request = { url, ...options }; return { ok: true, status: 200, json: async () => ({ ok: true }) } }
  try {
    await api.searchJobs({ q: 'nurse & ICU', location: 'New York' })
    assert.equal(new URL(request.url).searchParams.get('q'), 'nurse & ICU')
    assert.equal(request.headers.Authorization, 'Bearer candidate-token')
    await api.applyForJob('job/id', { resumeId: 'r' })
    assert.ok(request.url.endsWith('/jobs/job%2Fid/apply'))
    assert.equal(JSON.parse(request.body).resumeId, 'r')
    await api.uploadResume(new Blob(['resume']))
    assert.ok(request.body instanceof FormData)
    assert.equal(request.headers['Content-Type'], undefined)
    globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) })
    await assert.rejects(api.getDashboard(), /Forbidden/)
  } finally { globalThis.fetch = originalFetch }
})
