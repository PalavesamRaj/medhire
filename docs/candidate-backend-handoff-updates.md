# MedHire Candidate Backend Handoff — Updated Contract

**Purpose:** Share the implementation updates and integration confirmations needed for the candidate onboarding and dashboard flows. This document supplements the revised candidate backend handoff. Browser routes are not API routes.

## 1. Important route distinction

Candidate-facing React pages continue to use routes such as `/candidate/profile/personal` and `/candidate/profile/complete`. API requests use the authenticated candidate resource under `/api/candidates/me/...`; do not rename frontend routes to match API endpoints.

The frontend sends the bearer access token on candidate API calls. The candidate is identified from the token; the client does not submit a candidate ID.

## 2. Nine-step onboarding API sequence

| Step / purpose | Method and API path | Request |
|---|---|---|
| Read saved profile | GET `/api/candidates/me/profile` | None |
| Read durable onboarding progress | GET `/api/candidates/me/onboarding` | None |
| 1. Resume (optional) | POST `/api/candidates/me/resume` | `multipart/form-data`, key `resume` |
| 2. Personal details | PUT `/api/candidates/me/personal` | JSON; see DTO below |
| 3. Professional details | PUT `/api/candidates/me/professional` | JSON: `currentJobTitle`, `yearsOfExperience`, `currentEmployer`, `specialty`, `licenseNumber`, `licenseState`, `npiNumber`, `professionalSummary` |
| 4. Education | PUT `/api/candidates/me/education` | JSON education entries; confirm envelope/replace semantics |
| 5. Work experience | PUT `/api/candidates/me/experience` | JSON work-experience entries |
| 6. Skills | PUT `/api/candidates/me/skills` | JSON skills |
| 7. Certifications | PUT `/api/candidates/me/certifications` | JSON certification entries |
| 8. Career preferences | PUT `/api/candidates/me/preferences` | JSON preferences |
| 9. Complete onboarding | POST `/api/candidates/me/profile/complete` | Empty JSON object `{}` |
| Optional skip/progress | PATCH `/api/candidates/me/onboarding/steps/:stepKey` | `{ "status": "SKIPPED" }` |

Step keys for progress are `resume`, `personal`, `professional`, `education`, `experience`, `skills`, `certifications`, and `preferences`. Progress statuses are `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, and `SKIPPED`. A later valid save may change a skipped step to completed. Skip must not replace existing saved section data with empty values.

The frontend saves valid section data on Next. Resume may be skipped. Steps 2–8 expose Skip; skipping bypasses frontend required-field validation, but backend security and data-integrity checks remain active. The final completion endpoint must allow the agreed skipped-step policy and must not require every optional section.

## 3. Personal information DTO — relevant to current validation report

The email displayed on the personal-details screen is read-only and owned by authentication. The frontend now omits it from the personal-details update body. The selected gender is sent lower-case; the supported country options are translated to two-letter codes (`US`, `IN`, `CA`, `GB`, `AU`; `OTHER` for Other). The date input submits an ISO calendar date (`YYYY-MM-DD`).

Example request for the values shown in the current personal screen:

```json
{
  "firstName": "Jegan",
  "lastName": "C",
  "phoneNumber": "9884626545",
  "dateOfBirth": "1999-09-20",
  "gender": "male",
  "country": "IN",
  "city": "Trichy"
}
```

Optional address fields (`address`, `state`, `zipCode`) are included only when present. Please confirm exact accepted gender values, whether `OTHER` is valid for country, and whether `phoneNumber` accepts an unformatted national number. In the example screenshot the UI locale displays the date as `20-09-1999`; the underlying date value/request should remain `1999-09-20`.

## 4. Validation response required by the frontend

The message “Please correct the highlighted fields.” without a field map does not tell the user or frontend which field the backend rejected. For validation failures, return HTTP 422 and include field-level errors using this shape (or document an equivalent shape consistently):

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields.",
  "errors": {
    "dateOfBirth": "Date of birth must be in YYYY-MM-DD format.",
    "country": "Unsupported country code."
  }
}
```

The frontend reads `errors`, `fields`, `error.fields`, or `error.errors`, maps field names to the active form, and displays field-level messages. If no field map is returned, it can only display the general server message. Please return exact DTO field names (camelCase) where possible.

Other expected errors: 400 for malformed input, 401 for missing/expired session, 403 for forbidden access, 404 for missing resources, 409 for conflicts, 413 for oversized upload, 415 for unsupported media type. Common response envelope: `{ "success": true, "message"?: "...", "data"?: ... }`.

## 5. Profile strength and completion

Onboarding completion and profile strength are separate. POST completion may succeed with steps skipped; profile strength must still reflect populated and valid information, not be forced to 100% merely because onboarding finished.

Frontend calculation currently scores Personal Information, Professional Information, Education, Skills, and Career Preferences. Resume and certifications are optional and excluded. Work Experience is excluded for candidates reporting one year or less, but included as a required section for candidates reporting more than one year. A populated work-history section must pass the date/entry validation to count as complete.

Please confirm the canonical `yearsOfExperience` representation. The frontend dropdown currently uses labels such as `Less than 1 year`, `1–2 years`, `3–5 years`, `6–10 years`, `11–15 years`, and `16+ years`, while the older example shows a number. Prefer a documented numeric value or stable enum in storage/responses, with a UI display label mapping. If the server returns `profileStrength`, specify its formula and source fields so the dashboard can reconcile with the frontend result.

Completion response example:

```json
{
  "success": true,
  "data": {
    "profileCompleted": true,
    "onboardingStatus": "COMPLETED",
    "profileStrength": 80,
    "redirectTo": "/candidate/dashboard"
  }
}
```

## 6. Live job search and dashboard data

| Purpose | API path | Query/request |
|---|---|---|
| Search/list jobs and provide autocomplete suggestions | GET `/api/jobs` | `q`, `location`, `specialty`, `employmentType`, `workSetting`, `page`, `pageSize`, `sort`; the frontend also searches title/company and sends `hospital` from the company field—please confirm or alias it |
| Get one job | GET `/api/jobs/:jobId` | None |
| Submit application | POST `/api/jobs/:jobId/applications` | `{ "resumeId": "...", "coverLetter": "..." }` |
| Candidate dashboard | GET `/api/candidates/me/dashboard` | None |
| Candidate summary | GET `/api/candidates/me/summary` | None |
| Candidate applications | GET `/api/candidates/me/applications` | None; frontend can use an `applications` or `results` array |
| Saved jobs list | GET `/api/candidates/me/saved-jobs` | None; records may contain `jobId` and optionally embedded `job` |
| Save a job | POST `/api/candidates/me/saved-jobs` | `{ "jobId": "..." }` |
| Remove a saved job | DELETE `/api/candidates/me/saved-jobs/:jobId` | None |
| Resume list/upload/download/delete | GET `/api/candidates/me/resumes`; POST `/api/candidates/me/resume`; GET `/api/candidates/me/resumes/:resumeId/download`; DELETE `/api/candidates/me/resumes/:resumeId` | Upload is multipart key `resume` |
| Privacy | PUT `/api/candidates/me/privacy` | `profileVisible`, `recruiterDiscoverable`, `resumeVisible`, `contactVisible`, `openToWork` |

Job search should return matching live results as the user types (the UI debounces requests and renders up to six suggestions). The current response reader accepts an array directly or arrays under `data`, `jobs`, `results`, or `items`. Job records should expose an ID (`id`/`jobId`), title (`title`/`jobTitle`), organization, location, employment type and specialty. Please confirm canonical names and response envelope.

Dashboard may return `profileViews`, `applications`, `savedJobs`, `profileStrength`, `recommendedJobs`, and `recentActivity`; summary may return `chartSeries`. Missing metrics should be represented as unavailable/zero as agreed, never replaced with sample candidate records.

## 7. Profile photo, logout, and confirmation items

- Profile photo upload is implemented against a **proposed** endpoint: POST `/api/candidates/me/profile/photo`, multipart key `photo`. Return `{ "success": true, "data": { "photoUrl": "https://..." } }`. Please confirm the path, accepted MIME types/size, storage, and URL/access policy before relying on it.
- Candidate logout currently clears client-side access/refresh tokens and candidate draft/identity. No server logout/revocation endpoint was specified. If refresh tokens must be revoked, provide the logout API path and payload.
- Confirm resume approval/status fields and secure download behavior. Candidate-submitted credentials are not assumed verified.
- Confirm privacy field mapping and whether all listed settings are supported. Unsupported fields are not saved by the frontend.
- Provide current OpenAPI/Postman collection and working test credentials/environment to verify responses end-to-end.

## 8. Security and ownership

Derive candidate identity exclusively from the bearer token. Enforce ownership on every `/candidates/me/...` endpoint. Validate files by content and size, not only filename. Keep resumes and profile photos private or serve them through authorized URLs. Do not trust frontend validation, skip state, profile strength, approval state, or role claims.
