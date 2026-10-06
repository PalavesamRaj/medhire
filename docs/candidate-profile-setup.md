# Candidate profile setup

Frontend implementation using the existing React, React Router, Tailwind, Button, form controls, Logo, and ToastProvider. Candidate sections load from and save to the authenticated backend; session storage is only a draft fallback. Start at `/candidate/profile/personal`.

The layout follows the supplied 820:620 split, blue progress indicator, compact form cards, and dark photographic panel. It reuses existing healthcare assets; the exact individual photographs from the screenshots were not supplied as standalone assets. Below the desktop breakpoint the decorative panel is hidden and fields stack on narrow screens.

## Screens, routes, and data

All page files below are under `src/pages/candidate/profile-setup/`. Edits are retained in context/sessionStorage while filling a step; Next saves valid section data to the backend, while Skip records progress when that optional API is available and never sends an empty replacement payload.

| Created file | Responsibility | Route | API data | Next screen |
| --- | --- | --- | --- | --- |
| ResumeUpload.jsx | Optional browse/drop, 5 MB/type validation and upload before continuing | `/candidate/profile/resume` | Multipart `resume` file when selected; upload helper is available | Personal Information |
| PersonalInformation.jsx | Contact details, required field validation, readonly signed-in email | `/candidate/profile/personal` | `personalInformation`: firstName, lastName, email, phoneNumber, dateOfBirth, gender, country, address, city, state, zipCode | Professional Information |
| ProfessionalInformation.jsx | Career details, specialty, license and numeric NPI | `/candidate/profile/professional` | `professionalInformation`: currentJobTitle, yearsOfExperience, currentEmployer, specialty, licenseNumber, licenseState, npiNumber, professionalSummary | Education |
| Education.jsx | Mandatory repeatable education entries | `/candidate/profile/education` | `education[]`: id, degree, fieldOfStudy, institutionName, graduationYear | Work Experience |
| WorkExperience.jsx | Optional repeatable employment entries; current employment disables and clears end dates | `/candidate/profile/work-experience` | `workExperience[]`: id, jobTitle, employerName, employmentType, location, startMonth, startYear, endMonth, endYear, currentlyWorking, description | Skills |
| Skills.jsx | Search, add, remove and deduplicate skill chips | `/candidate/profile/skills` | `skills[]`: `{ name }` | Certifications |
| Certifications.jsx | Optional repeatable credentials; no-expiry toggle | `/candidate/profile/certifications` | `certifications[]`: id, certificationName, issuingOrganization, credentialId, issueDate, expiryDate, doesNotExpire | Career Preferences |
| CareerPreferences.jsx | Employment/specialty multi-selection, location chips and work preferences | `/candidate/profile/career-preferences` | `careerPreferences`: desiredJobTitle, preferredSpecialties, employmentTypes, preferredLocations, workSetting, shiftPreference, expectedSalary, salaryType, availableFrom, willingToRelocate, remotePreference | Profile Setup Complete |
| ProfileSetupComplete.jsx | Completion checklist and dashboard action; redirects direct access without a successful submission | `/candidate/profile/complete` | `POST /candidates/me/profile/complete` contract is available; UI completion is not yet wired to it | `/candidate/dashboard` |
| ../CandidateDashboard.jsx | Minimal dashboard landing destination with profile and job links | `/candidate/dashboard` | None | Continue setup or `/find-jobs` (existing placeholder) |

## Reusable files

All component files in this table are under `src/components/candidate/profile/`. They do not call APIs themselves.

| Created file | Responsibility | Used on / next screen | Data handled |
| --- | --- | --- | --- |
| CandidateProfileLayout.jsx | Logo, headings, accessible heading focus, responsive split and form shell | All nine setup routes; next screen provided by the page | Form content, submission callback, errors and loading state |
| ProfileProgress.jsx | Nine-stage indicator with current-step semantics | All setup routes; no navigation | Current step |
| ProfileNavigation.jsx | Back/Next/Complete buttons and privacy footer | Steps 1–8; adjacent setup route | Step and loading state |
| ProfileSidePanel.jsx | Existing healthcare images, dark overlay, shared copy | All setup routes; no navigation | Current step selects an image |
| ProfileField.jsx | Controlled shared Input/Select/textarea, associated labels, inline errors | Data-entry routes; no navigation | One field value/error |
| useProfileStep.js | Section updates, validation, error focus and Next navigation | Steps 1–7; next setup route | Current profile section |
| RepeatableStep.jsx | Shared add/remove list flow and minimum-entry behavior | Education, work experience, certifications; next setup route | Entry arrays with stable IDs |
| RepeatableCard.jsx | Shared card container and accessible remove control | Repeatable entry routes; no navigation | Card title and children |
| EducationCard.jsx | Education entry controls | Education; Work Experience follows | One education object |
| WorkExperienceCard.jsx | Employment controls and current-work toggle | Work Experience; Skills follows | One work experience object |
| SkillInput.jsx | Search/custom entry, suggestions, removable chips and duplicate prevention | Skills and Career Preferences; no navigation | Skill objects or location strings |
| CertificationCard.jsx | Credential controls and no-expiry toggle | Certifications; Career Preferences follows | One certification object |

## State, utilities, and integration

| Created file | Responsibility | Routes / next screen | Eventual API data |
| --- | --- | --- | --- |
| `src/context/CandidateProfileContext.jsx` | Profile state, shared across candidate routes, draft persistence, signed-in identity and successful-submission state | All candidate routes; pages control navigation | Complete profile shape |
| `src/lib/candidateProfileDraft.js` | loadProfileDraft/saveProfileDraft/clearProfileDraft with malformed/unavailable storage handling | All setup routes; none | No API calls; JSON sections only, never resume bytes/File |
| `src/lib/candidateProfileOptions.js` | Shared options, skill suggestions and route/step metadata | All setup routes; adjacent step lookup | Selected option strings |
| `src/lib/candidateProfileValidation.js` | Eight validators, row-specific errors and cross-field date checks | Steps 1–8; navigation allowed after validation | Validated sections and resume |
| `src/lib/candidateProfileApi.js` | Central endpoints, authenticated requests, timeout/error handling, section saves, resume upload and onboarding completion | Ordered API contract: resume, personal, professional, education, experience, skills, certifications, preferences, completion | JSON sections; resume upload uses multipart |
| `tests/candidateProfile.test.mjs` | Regression tests for validation, draft storage and API request/error behavior | None | Mocked test requests only |
| `docs/candidate-profile-setup.md` | File, route, data and integration guide | None | Documents the contract |

`App.jsx` adds a nested provider and all requested routes without changing the public/auth routes. `Login.jsx` only changes successful-login routing and records candidate email; its design is unchanged. The role is read from `response.user.role`, then `response.role`, then the login query parameter, defaulting to candidate. A recognized recruiter still returns to the existing home page. Candidate identity changes clear a previous candidate draft. Registration retains its existing verification-then-login flow.

Draft key: `medhire_candidate_profile_draft` in sessionStorage. Next, Back, and browser history retain values. Reload restores text/selection data; the resume must be reselected because its File stays only in context. A successful final submission clears the draft. Failed submission keeps the draft and file for retry. The completion receipt exists in React state for the current candidate route session; reloading completion redirects to setup. The minimal dashboard is not a backend-backed account dashboard.

Required onboarding policy follows backend validation: personal details, professional title/experience/specialty, education, skills, and career preferences are validated when submitted. Resume, work history, and certifications may be skipped; added entries must be valid. Profile strength excludes resume and certification, and excludes work experience for candidates with one year or less; candidates with more than one year need at least one valid work entry for full strength. Optional NPI must be ten digits. Salary is explicitly labeled USD and requires a period when provided. Future graduation years up to ten years ahead are permitted for students.

## Backend contract currently used

`VITE_API_BASE_URL` defaults to `/api` (the deployment prefix in the updated backend handoff). Set it to the real service base URL if needed. Requests read `medhire_access_token` from localStorage and include `Authorization: Bearer <token>` when present. No token or user secrets are embedded in source. Browser onboarding routes remain `/candidate/profile/*`; the API routes below are separate backend endpoints.

| Step / purpose | Method | Endpoint relative to base | Payload |
| --- | --- | --- |
| Progress lookup | GET | `/candidates/me/onboarding` | None |
| 1 — Resume Upload | POST | `/candidates/me/resume` | Optional FormData with `resume` File |
| 2 — Personal Information | PUT | `/candidates/me/personal` | Personal object |
| 3 — Professional Information | PUT | `/candidates/me/professional` | Professional object |
| 4 — Education | PUT | `/candidates/me/education` | Education entries |
| 5 — Work Experience | PUT | `/candidates/me/experience` | Work experience entries |
| 6 — Skills | PUT | `/candidates/me/skills` | Skills |
| 7 — Certifications | PUT | `/candidates/me/certifications` | Certification entries |
| 8 — Career Preferences | PUT | `/candidates/me/preferences` | Preferences object |
| 9 — Complete onboarding | POST | `/candidates/me/profile/complete` | Empty JSON object `{}` |
| Optional progress/skip | PATCH | `/candidates/me/onboarding/steps/:stepKey` | `{ "status": "SKIPPED" }` |
| Profile retrieval | GET | `/candidates/me/profile` | None |
| Profile photo upload (proposed; confirm with backend) | POST | `/candidates/me/profile/photo` | FormData with `photo` image file |

Resume upload is separate from completion; the final endpoint marks onboarding complete and does not accept a combined profile/resume multipart payload. The handoff describes section saves as partial-draft capable, and Skip must not send empty data that overwrites saved values. A 2xx JSON response or 204 is treated as success. Error JSON may use `message` or `error.message`. Backend validation, file inspection, authentication/authorization, approval status and durable progress remain backend responsibilities. These endpoints are a proposed contract and should be confirmed with the backend.

Run checks with `node --test tests/candidateProfile.test.mjs` and `npm run build`. Tests use Node's built-in test runner and the existing Vite/esbuild dependency, with no new packages.
