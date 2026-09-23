# Candidate profile setup

Frontend implementation using the existing React, React Router, Tailwind, Button, form controls, Logo, and ToastProvider. No backend or new dependencies were added. Start at `/candidate/profile/personal`.

The layout follows the supplied 820:620 split, blue progress indicator, compact form cards, and dark photographic panel. It reuses existing healthcare assets; the exact individual photographs from the screenshots were not supplied as standalone assets. Below the desktop breakpoint the decorative panel is hidden and fields stack on narrow screens.

## Screens, routes, and data

All page files below are under `src/pages/candidate/profile-setup/`. Steps save to context/sessionStorage on edit; they do not send network requests individually. The section methods in the API adapter are available for future backend integration.

| Created file | Responsibility | Route | API data | Next screen |
| --- | --- | --- | --- | --- |
| PersonalInformation.jsx | Contact details, required field validation, readonly signed-in email | `/candidate/profile/personal` | `personalInformation`: firstName, lastName, email, phoneNumber, dateOfBirth, gender, country, address, city, state, zipCode | Professional Information |
| ProfessionalInformation.jsx | Career details, specialty, license and numeric NPI | `/candidate/profile/professional` | `professionalInformation`: currentJobTitle, yearsOfExperience, currentEmployer, specialty, licenseNumber, licenseState, npiNumber, professionalSummary | Education |
| Education.jsx | Mandatory repeatable education entries | `/candidate/profile/education` | `education[]`: id, degree, fieldOfStudy, institutionName, graduationYear | Work Experience |
| WorkExperience.jsx | Optional repeatable employment entries; current employment disables and clears end dates | `/candidate/profile/work-experience` | `workExperience[]`: id, jobTitle, employerName, employmentType, location, startMonth, startYear, endMonth, endYear, currentlyWorking, description | Skills |
| Skills.jsx | Search, add, remove and deduplicate skill chips | `/candidate/profile/skills` | `skills[]`: `{ name }` | Certifications |
| Certifications.jsx | Optional repeatable credentials; no-expiry toggle | `/candidate/profile/certifications` | `certifications[]`: id, certificationName, issuingOrganization, credentialId, issueDate, expiryDate, doesNotExpire | Career Preferences |
| CareerPreferences.jsx | Employment/specialty multi-selection, location chips and work preferences | `/candidate/profile/career-preferences` | `careerPreferences`: desiredJobTitle, preferredSpecialties, employmentTypes, preferredLocations, workSetting, shiftPreference, expectedSalary, salaryType, availableFrom, willingToRelocate, remotePreference | Resume Upload |
| ResumeUpload.jsx | Browse/drop, 5 MB/type validation, whole-profile validation and explicit submission | `/candidate/profile/resume` | Multipart `profile` JSON plus `resume` file | Profile Setup Complete, only after successful API response |
| ProfileSetupComplete.jsx | Completion checklist and dashboard action; redirects direct access without a successful submission | `/candidate/profile/complete` | None | `/candidate/dashboard` |
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
| `src/lib/candidateProfileApi.js` | Central endpoints, authenticated requests, timeout/error handling, section saves and multipart submission | Final submission from resume; Complete on success | JSON sections or multipart profile/resume |
| `tests/candidateProfile.test.mjs` | Regression tests for validation, draft storage and API request/error behavior | None | Mocked test requests only |
| `docs/candidate-profile-setup.md` | File, route, data and integration guide | None | Documents the contract |

`App.jsx` adds a nested provider and all requested routes without changing the public/auth routes. `Login.jsx` only changes successful-login routing and records candidate email; its design is unchanged. The role is read from `response.user.role`, then `response.role`, then the login query parameter, defaulting to candidate. A recognized recruiter still returns to the existing home page. Candidate identity changes clear a previous candidate draft. Registration retains its existing verification-then-login flow.

Draft key: `medhire_candidate_profile_draft` in sessionStorage. Next, Back, and browser history retain values. Reload restores text/selection data; the resume must be reselected because its File stays only in context. A successful final submission clears the draft. Failed submission keeps the draft and file for retry. The completion receipt exists in React state for the current candidate route session; reloading completion redirects to setup. The minimal dashboard is not a backend-backed account dashboard.

Required policy: personal fields specified in the prompt; professional job title, experience and specialty; at least one complete education entry; at least one skill; desired job title and an employment type; resume. Work history and certifications can be skipped, but added entries must be complete. Optional NPI must be ten digits. Salary is explicitly labeled USD and requires a period when provided. Future graduation years up to ten years ahead are permitted for students.

## Backend contract to connect later

`VITE_API_BASE_URL` defaults to `http://localhost:5000/api`. Set it to the real service base URL. Requests read `medhire_access_token` from localStorage and include `Authorization: Bearer <token>` when present. No token or user secrets are embedded in source.

| Method | Endpoint relative to base | Payload |
| --- | --- | --- |
| GET | `/candidate/profile` | None |
| PUT | `/candidate/profile/personal` | Personal object |
| PUT | `/candidate/profile/professional` | Professional object |
| PUT | `/candidate/profile/education` | Education array |
| PUT | `/candidate/profile/work-experience` | Work experience array |
| PUT | `/candidate/profile/skills` | Skills array |
| PUT | `/candidate/profile/certifications` | Certifications array |
| PUT | `/candidate/profile/career-preferences` | Preferences object |
| POST | `/candidate/profile/resume` | FormData with `resume` File; exposed for future use, never automatic |
| POST | `/candidate/profile/submit` | FormData with `profile` JSON excluding resume and `resume` File |

The final endpoint is intended to accept the profile and file together. A 2xx JSON response or 204 is treated as success. Error JSON may use `message` or `error.message`. Backend validation, file inspection, authentication/authorization, approval status and profile retrieval remain backend responsibilities. There is no simulated success or automatic upload. The supplied API URLs are a proposed contract and may be changed centrally when the backend is ready.

Run checks with `node --test tests/candidateProfile.test.mjs` and `npm run build`. Tests use Node's built-in test runner and the existing Vite/esbuild dependency, with no new packages.
