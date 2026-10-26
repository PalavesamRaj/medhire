# MedHire Candidate and HR (Recruiter) API Handoff

**Prepared:** 26 October 2026
**Audience:** MedHire backend team
**Scope:** Candidate portal and HR/recruiter portal, including shared authentication and public job discovery. Admin-only APIs are out of scope.

## 1. How to use this handoff

This document consolidates the frontend API inventory, the existing candidate and recruiter handoffs, the known frontend/backend comparisons, and the request/response example attached to the request. It is intended to be the single review checklist for backend implementation and integration.

**Important contract status:** this repository contains frontend adapters and handoff documents, not the backend implementation or a live OpenAPI specification. Therefore:

- **Frontend request** means the request currently constructed by this workspace.
- **Documented/proposed** means an earlier handoff describes the contract, but this document has not independently verified it against a running backend.
- **Gap / confirm** means the backend must provide its actual behavior or resolve a conflict before the contract is considered complete.
- JSON examples using angle-bracket values are illustrative placeholders, not real user records or captured production responses.
- The attached preferences screenshot is treated as a backend example supplied by the user. Where it conflicts with the frontend adapter, both are shown and backend confirmation is requested.

The frontend API base is `VITE_API_BASE_URL`, defaulting to `/api`. All paths in the tables below include `/api` for backend handoff clarity. Browser routes such as `/candidate/profile/personal` and `/accept-invitation` are not API endpoints.

## 2. Shared HTTP and response conventions

### Authentication

Authenticated JSON calls use:

```http
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json
```

The authorization header uses the Bearer scheme with the access token. Do not require `Content-Type` for GET requests or multipart uploads. For multipart uploads, the browser must set the boundary. The frontend attempts one access-token refresh after a 401 using `POST /api/auth/refresh`; logout calls `POST /api/auth/logout`.

### Recommended canonical envelope

Please confirm and use one consistent success and error shape across candidate and recruiter endpoints. Frontend adapters currently tolerate some envelope variations, but that tolerance is compatibility behavior, not a request to support every alias indefinitely.

```json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 1
  }
}
```

`pagination` is required on list endpoints; `total` must count records matching the filters, and an empty result must be `data: []`, not missing data or fabricated rows.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "email": "Enter a valid email address."
    },
    "requestId": "<request-id>"
  }
}
```

Use ISO 8601 UTC timestamps for instants and `YYYY-MM-DD` for calendar dates. Return stable opaque IDs. Never return passwords, password hashes, access tokens in errors, invitation tokens in list responses, or private candidate contact/resume data to an unauthorized recruiter.

### Contract completeness rule (apply to every endpoint below)

The endpoint inventory records the frontend's actual calls, but a behavior note by itself is not a complete API contract. For implementation and integration, publish each operation with **all** of the following: method and path; authentication/role and organization-state requirements; path/query/header parameters; exact JSON or multipart request schema (required, optional, nullable, defaults, enums, limits); a sanitized success example for every success status; error statuses and the canonical error body; pagination/filter/sort rules for lists; and side effects/idempotency for mutations. The response examples below are contract shapes to adopt or confirm, not claims about a deployed backend.

For JSON endpoints, use `application/json`. For a successful resource mutation, return `200` with the resource/result in `data`; use `201` for newly created resources where appropriate; use `204` only when there is intentionally no response body. For invalid input use `422` (or confirm a single chosen 400/422 convention); use `401` for missing/expired authentication, `403` for authenticated but unauthorized, `404` for absent or inaccessible resources, `409` for state/duplicate conflicts, and `500` for unexpected server errors. Every non-204 response should be JSON and carry a request ID. Do not return a success envelope for failures.

Example validation failure (field keys must match the request schema):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "expectedSalary": "Must be a non-negative number." },
    "requestId": "req_example"
  }
}
```

Example authorization failure (use the relevant stable code, such as `ORGANIZATION_NOT_VERIFIED` or `CANDIDATE_ACCESS_LOCKED`):

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "requestId": "req_example"
  }
}
```

For each list response, keep rows in `data` and pagination beside it; do not alternate between `data.items`, `results`, and a root array:

```json
{
  "success": true,
  "data": [{ "id": "item_example" }],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

`total` is the number of records matching the filters before pagination. Empty lists return `data: []`, `total: 0`, and `totalPages: 0` (or 1 if the backend chooses that convention globally; document one choice and use it consistently). Query page numbers are one-based. Reject unsupported sort/filter values with a validation error rather than silently changing their meaning.

## 3. Shared authentication and account lifecycle

Candidate and recruiter registration use shared auth endpoints. The recruiter adapter normalizes recruiter registration fields; candidate registration is handled through the same auth API with `role: "candidate"`.

| Method and endpoint | Frontend request | Expected result / comparison |
|---|---|---|
| `POST /api/auth/register` | Candidate: role, full name, email, phone, password and terms acceptance. Recruiter: see the exact body below. | Create the correct role and account. Recruiter registration must also create/link an organization and an active OWNER membership so pending verification document uploads can be authorized. Confirm response and email verification behavior. |
| `POST /api/auth/login` | `{ "email": "...", "password": "...", "rememberMe": false }` | Return `accessToken`, `refreshToken` or documented cookie equivalent, and `user` with stable ID, role and email-verification state. Recruiter also needs organization ID/name/status. Frontend accepts root or `data`-nested auth fields. |
| `POST /api/auth/verify-code` | `{ "email": "...", "code": "...", "purpose": "registration" }`; password reset/email change use their corresponding purpose. | Consume short-lived codes and throttle attempts. Reset flow conflict: existing docs say reset may require `resetToken`, but do not confirm how `verify-code` grants it. Specify exact sequence. |
| `POST /api/auth/resend-code` | `{ "email": "...", "purpose": "registration" }` | Resend with throttling and generic account-enumeration-safe responses. |
| `POST /api/auth/forgot-password` | `{ "email": "..." }` | Generic response whether or not account exists; issue a short-lived recovery code/grant. |
| `POST /api/auth/reset-password` | Expected `{ "email": "...", "resetToken": "...", "newPassword": "..." }` per earlier handoff. | **Gap:** define whether verification returns a token, creates a grant cookie, or uses a separate exchange endpoint. Bind and consume the grant once; revoke sessions as agreed. |
| `PATCH /api/auth/change-password` | `{ "currentPassword": "...", "newPassword": "..." }` | Verify existing password, enforce server policy, and define session revocation behavior. |
| `POST /api/auth/change-email` | `{ "newEmail": "..." }`; the current frontend does not send a password. | Send email-change confirmation. Earlier handoff versions listed a password, but the spreadsheet's backend request example and current UI use only `newEmail`. |
| `POST /api/auth/change-email/confirm` | `{ "token": "..." }` | **Gap:** specify if this token is a link token or a code exchanged through `verify-code` with `purpose:"email_change"`. |
| `GET /api/auth/me` | Authenticated GET | Return current server-verified identity and recruiter organization status. |
| `POST /api/auth/refresh` | Cookie credentials and/or `{ "refreshToken": "..." }` | Rotate refresh token, return a valid access token, and document cookie/CORS/CSRF policy. |
| `POST /api/auth/logout` | Authenticated request; optionally `{ "refreshToken": "..." }` | Revoke server-side refresh session; frontend clears its local session even if offline. |
| `GET /api/auth/invitations/{token}` | Public invitation-preview request | Return safe inviter/organization/invitation details; validate expiry/revocation without exposing secrets. |
| `POST /api/auth/accept-invite` | `{ "token": "...", "password": "...", "fullName": "..." }` (`fullName` optional) | Consume invitation once, create/link account and membership, and return the documented auth result. Email must contain a clickable URL to `/accept-invitation?token=<encoded-token>`. |

### Recruiter registration request

The frontend sends this to `POST /api/auth/register`; phone is normalized to a `+91` number, email is lowercased, and password must never be echoed:

```json
{
  "role": "recruiter",
  "fullName": "<recruiter-name>",
  "email": "<work-email>",
  "phone": "+91<phone-number>",
  "designation": "<designation>",
  "organizationName": "<organization-name>",
  "organizationWebsite": "<website-or-empty-string>",
  "city": "<city>",
  "state": "<state>",
  "password": "<redacted-password>",
  "termsAccepted": true
}
```

The registration form does not collect organization registration number, street address, postal code, country, organization type, license or accreditation. Those cannot be populated from signup data unless captured elsewhere.

## 4. Candidate API contract

Every `/api/candidates/me/...` route must scope records to the authenticated candidate. A client-supplied candidate ID must never establish ownership.

### 4.1 Candidate onboarding/profile

The frontend saves each completed step and separately tracks skipped steps. The backend must preserve prior section data when an optional step is skipped.

| Method and endpoint | Request from frontend | Expected backend behavior / data |
|---|---|---|
| `GET /api/candidates/me/profile` | None | Return the candidate profile and completion state. |
| `GET /api/candidates/me/onboarding` | None | Return per-step status/progress. Statuses used by the UI: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`. |
| `PATCH /api/candidates/me/onboarding/steps/{stepKey}` | `{ "status": "SKIPPED" }` (default action) | Persist an allowed status for `resume`, `personal`, `professional`, `education`, `experience`, `skills`, `certifications`, or `preferences`. Do not clear the saved section. |
| `PUT /api/candidates/me/personal` | `firstName`, `lastName`, `phoneNumber`, `dateOfBirth`, `country`, `city`, `state`, `zipCode`; the frontend omits `gender`, `address`, and read-only `email` to match the backend example. | Persist personal data. Date format is `YYYY-MM-DD`. Frontend maps common country names to `US`, `IN`, `CA`, `GB`, `AU`; unsupported `Other` is omitted. Confirm accepted country codes and null/omission semantics. |
| `PUT /api/candidates/me/professional` | `currentJobTitle`, numeric `yearsOfExperience`, `currentEmployer`, `specialty`, `licenseNumber`, `licenseState`, `npiNumber`, `professionalSummary` | Persist professional details. Frontend maps experience-range labels to lower-bound numbers (e.g. `"3–5 years"` to `3`). Confirm numeric units and whether ranges should instead be represented explicitly. |
| `PUT /api/candidates/me/education` | `{ "education": [{ "degree": "...", "fieldOfStudy": "...", "institutionName": "...", "graduationYear": 2024 }] }`; frontend omits local row IDs. | Backend generates and returns stable IDs for persisted education rows. |
| `PUT /api/candidates/me/experience` | `{ "workExperience": [{ "jobTitle": "...", "employerName": "...", "employmentType": "FULL_TIME", "location": "...", "startMonth": 1, "startYear": 2022, "currentlyWorking": true, "description": "..." }] }`; frontend omits local row IDs, sends month numbers, and omits end month/year for current positions. | Persist history and define accepted employment enums. |
| `PUT /api/candidates/me/skills` | `{ "skills": ["Critical Care", "ICU"] }` | Frontend normalizes strings and `{name}`-like objects into unique non-empty strings. Return a canonical string-array shape to avoid `[object Object]` rendering. |
| `PUT /api/candidates/me/certifications` | `{ "certifications": [{ "id": "...", "certificationName": "...", "issuingOrganization": "...", "credentialId": "...", "issueDate": "YYYY-MM-DD", "expiryDate": "YYYY-MM-DD", "doesNotExpire": false }] }` | Persist certification entries. Define date rules, verification status ownership and optional fields. |
| `PUT /api/candidates/me/preferences` | See the request/response example and enum discrepancy below. | Save desired roles, specialties, employment, location, work setting, shifts, salary, availability, relocation and remote preference. Return durable step state. |
| `POST /api/candidates/me/resume` | Multipart `resume` file | Upload candidate-owned resume. Earlier handoff says PDF/DOC/DOCX up to 5 MB; confirm actual limit, MIME/content validation, malware scan and review status. |
| `POST /api/candidates/me/profile/photo` | Multipart `photo` file | Proposed profile-photo upload route. Confirm accepted MIME types, size limit, private storage and response shape. |
| `POST /api/candidates/me/profile/complete` | `{}` | Validate required fields and skip policy; return durable completion status. UI policy requires personal, professional title/experience/specialty, education, skills and preferences; resume, work history and certifications can be optional. |
| `PATCH /api/candidates/me/profile` | Section objects; frontend maps headline to `professional.currentJobTitle`, summary to `professional.professionalSummary`, and location/name to `personal` properties. | Update only supplied editable fields. Preserve auth-owned email and server-owned completion/strength/verification state. |

#### Preferences: canonical backend request and screenshot discrepancy

The backend request example cross-checked in `MEDHIRE_ALL_APIS_REQUEST_RESPONSE_EXAMPLES.md` is the canonical request for `PUT /api/candidates/me/preferences`:

```json
{
  "desiredJobTitle": "ICU Nurse",
  "preferredSpecialties": ["Critical Care"],
  "employmentTypes": ["FULL_TIME"],
  "preferredLocations": ["Chennai"],
  "workSetting": ["ONSITE"],
  "shiftPreference": ["DAY"],
  "expectedSalary": 900000,
  "salaryType": "ANNUAL",
  "availableFrom": "2026-10-01",
  "willingToRelocate": false,
  "remotePreference": "ONSITE"
}
```

The attached screenshot's response example (not runtime-verified):

```json
{
  "success": true,
  "data": {
    "stepStatus": "COMPLETED"
  }
}
```

The spreadsheet cross-check against `MEDHIRE_ALL_APIS_REQUEST_RESPONSE_EXAMPLES.md` identifies `ONSITE` and `ANNUAL` as the backend values. The frontend mapper already emits these values, along with the enum and array shapes described in `candidateProfileApi.js`. The screenshot's `HOSPITAL` and `YEARLY` values are stale; its `stepStatus` response is still only a supplied example, not a captured runtime response.

Define whether missing fields mean “leave unchanged” or “clear”, whether empty arrays clear a preference, the currency and salary period, and whether `availableFrom` is inclusive.

The screenshot's response example is:

```json
{
  "success": true,
  "data": { "stepStatus": "COMPLETED" }
}
```

The following full response remains a recommendation, not an observed backend response:

```json
{
  "success": true,
  "data": {
    "stepStatus": "COMPLETED",
    "preferences": {
      "desiredJobTitle": "ICU Nurse",
      "preferredSpecialties": ["Critical Care"],
      "employmentTypes": ["FULL_TIME"],
      "preferredLocations": ["Chennai"],
      "workSetting": ["ONSITE"],
      "shiftPreference": ["DAY"],
      "expectedSalary": 900000,
      "salaryType": "ANNUAL",
      "availableFrom": "2026-10-01",
      "willingToRelocate": false,
      "remotePreference": "ONSITE"
    }
  }
}
```

### 4.2 Candidate dashboard, account, and resume

| Method and endpoint | Request | Expected response / behavior |
|---|---|---|
| `GET /api/candidates/me/dashboard` | None | Candidate metrics such as profile views, applications, saved jobs, profile strength, recommended jobs and recent activity. Counts and periods need definitions. |
| `GET /api/candidates/me/summary` | None | Candidate-owned summary/chart series; define metrics, date range, and empty series. |
| `GET /api/candidates/me/resumes` | List query uses `page`/`pageSize` (frontend currently requests all pages at 100 per page). | List resume ID, filename, MIME type, size, upload time, review status and active flag. |
| `POST /api/candidates/me/resume` | Multipart `resume` | Upload; authorize ownership, validate file content/size, scan and store privately. |
| `DELETE /api/candidates/me/resumes/{resumeId}` | None | Delete/archive only the caller's resume; 204 is accepted by frontend. |
| `GET /api/candidates/me/resumes/{resumeId}/download` | Authenticated GET | Private stream or short-lived protected URL. Never expose a public resume URL. |
| `GET /api/candidates/me/privacy` | None | Return canonical candidate visibility settings. |
| `PUT /api/candidates/me/privacy` | Frontend sends the edited settings object. | Earlier handoff lists `profileVisible`, `recruiterDiscoverable`, `resumeVisible`, `contactVisible`, `openToWork`; confirm supported fields and recruiter masking semantics. |
| `GET /api/candidates/me/data-export` | None | **Gap:** frontend currently expects JSON and downloads it. Specify JSON vs file stream vs signed URL, filename, content type and URL expiry. |
| `DELETE /api/candidates/me/account` | No body. | Backend returns HTTP `202` with `{ "data": { "accountStatus": "INACTIVE" } }`; frontend signs the user out after success. The operation deactivates the account. |

### 4.3 Job search, applications, saved jobs, and public contact

| Method and endpoint | Request | Expected response / behavior |
|---|---|---|
| `GET /api/jobs` | `q`, `location`, `specialty`, `employmentType`, `workSetting`, `sort`, `page`, `pageSize`. Public browser uses page size 50; candidate authenticated pagination fetches 100 per page. | Return active/searchable job records with stable ID, title, organization, location, specialty, employment type and work setting. Define filter semantics and pagination. Candidate UI maps `hospital` to `q` and UI `type` to uppercase `employmentType`. |
| `GET /api/jobs/{jobId}` | None | Return active job detail, requirements and organization summary. |
| `POST /api/jobs/{jobId}/applications` | `{ "resumeId": "...", "coverLetter": "..." }` | Enforce active job, resume ownership/eligibility, duplicate-application policy, 3,000-character cover-letter limit, and candidate identity from token. Return application ID/status. |
| `GET /api/candidates/me/applications` | `page`, `pageSize` | Return only caller's applications and documented status enum. |
| `GET /api/candidates/me/saved-jobs` | `page`, `pageSize` | Return saved job IDs or embedded job records consistently. |
| `POST /api/candidates/me/saved-jobs` | `{ "jobId": "..." }` | Save idempotently; return persisted bookmark or documented 204. |
| `DELETE /api/candidates/me/saved-jobs/{jobId}` | None | Remove only caller's bookmark; idempotency and 204 behavior to confirm. |
| `POST /api/support/contact` | `{ "name": "...", "email": "...", "category": "...", "subject": "...", "message": "..." }` | Public contact form route used by frontend. Earlier admin handoff also mentions `/support/tickets` with a different schema. **Gap:** choose canonical route/schema, spam controls, rate limits and admin queue behavior. |

### 4.4 Notifications (shared candidate/recruiter surface)

| Method and endpoint | Request | Expected response / behavior |
|---|---|---|
| `GET /api/notifications?page=1&pageSize=10` | Authenticated list request | Return only the authenticated user's notifications. Frontend accepts `data` as an array or `data.items`. |
| `GET /api/notifications/unread-count` | None | Return `{ "unread": 0 }` or canonical envelope with unread count. |
| `PATCH /api/notifications/{notificationId}/read` | None | Mark only the caller's notification read. |
| `PATCH /api/notifications/read-all` | None | Mark all caller-owned notifications read. |

## 5. HR / recruiter API contract

Recruiter endpoints are authenticated and must be scoped to the recruiter’s active organization membership. Define verification gating per endpoint; pending organizations must be able to access the verification workflow and upload documents. The candidate identity and contact fields are separate access levels: professional details may be visible while locked, but direct contact and resume downloads must remain protected until the organization unlocks the candidate.

### 5.1 Dashboard, organization and team

| Method and endpoint | Frontend request | Response / behavior needed; comparison |
|---|---|---|
| `GET /api/recruiter/dashboard` | No query/body | Return organization summary, metrics, `recommendedCandidates`, `recentActivity`. Earlier docs describe this DTO as service-defined. Define metric periods and semantics; candidate searches must not count raw GETs/page loads. Empty lists must be `[]`. |
| `GET /api/recruiter/hospital-profile` | No query/body | Return persisted organization profile, verification status and hiring preferences. The frontend maps nested and flat aliases, but one canonical envelope is needed. |
| `PATCH /api/recruiter/hospital-profile` | Flat body: `{ "name": "...", "website": "...", "phone": "...", "address": "...", "city": "...", "state": "...", "postalCode": "...", "country": "...", "registrationNumber": "...", "description": "...", "hiringPreferences": { "specialties": [] } }`. Frontend maps UI field names to these backend names and sends confirmed specialties only. | Update only editable fields. Do not accept organization ID, owner or verification decision from client. Backend example only confirms `hiringPreferences.specialties`; location/employment preferences remain read-only until their contract is confirmed. |
| `POST /api/recruiter/organization/resubmit` | `{ "notes": "..." }` | Resubmit rejected organization for review. |
| `GET /api/recruiter/team` | No query/body | Existing contract is paginated membership rows only. Frontend needs member rows, persisted pending invitations and seat data. Recommended canonical shape is below; confirm eligibility and pagination. |
| `POST /api/recruiter/team/invitations` | `{ "email": "...", "fullName": "..." }` (`fullName` optional) | Create and email a persistent invitation. Return stable invitation ID, status and expiry. Confirm duplicate handling, expiry, seat reservation and delivery status. |
| `DELETE /api/recruiter/team/{userId}` | None | Remove member from authenticated organization; enforce role/owner rules, define last-owner behavior and return status/204. |

#### Recommended team response

```json
{
  "success": true,
  "data": [
    {
      "userId": "<user-id>",
      "fullName": "<member-name>",
      "email": "<member-email>",
      "role": "OWNER",
      "status": "ACTIVE"
    }
  ],
  "pendingInvitations": [
    {
      "invitationId": "<invitation-id>",
      "fullName": "<invitee-name>",
      "email": "<invitee-email>",
      "status": "INVITED",
      "createdAt": "2026-10-26T10:00:00Z",
      "expiresAt": "2026-11-02T10:00:00Z"
    }
  ],
  "seats": {
    "used": 2,
    "total": 5,
    "available": 3
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

The numbers are illustrative. Define whether pending invitations consume seats (recommended: if they reserve capacity, count them consistently in `used` and `available`). Return `0` for an actual zero seat limit; use a distinct unavailable/error state rather than a false zero.

### 5.2 Jobs and applications

| Method and endpoint | Frontend request | Response / behavior needed; comparison |
|---|---|---|
| `GET /api/recruiter/jobs` | Query filters and pagination; frontend fetches pages at 100/page | Return organization-owned jobs and pagination. Include stable `jobId`, title, status, location, specialty, employment type, work setting, salary bounds and timestamps. |
| `POST /api/recruiter/jobs` | Job fields: `title`, `description`, `location`, `specialty`, `employmentType`, `workSetting`, numeric salary bounds. Frontend maps salary text to `salaryMin`/`salaryMax`, adds default `ONSITE`, converts employment type and appends requirements into description. | Create organization-owned job, normally `PENDING_APPROVAL`. Define salary currency/period, required fields, enum values and response ID. |
| `PATCH /api/recruiter/jobs/{jobId}` | Same editable job fields; no status | Existing contract allows only owned `PENDING_APPROVAL`/`REJECTED` jobs; active jobs are not editable and frontend exposes Close instead. Confirm field validation and 422 behavior. |
| `POST /api/recruiter/jobs/{jobId}/close` | `{ "reason": "Position has been filled." }` | Close owned active job; define idempotency and whether reopening is supported. |
| `GET /api/recruiter/jobs/{jobId}/applications` | Filters/pagination | Return applicant application details with privacy-safe identity until unlocked; include masked initials/professional summary instead of exposing UUID as display name. |
| `GET /api/recruiter/applications/{applicationId}` | None | Return application and allowed candidate summary, organization/job ownership checked. |
| `POST /api/recruiter/applications/{applicationId}/review` | `{}` or `{ "reason": "..." }` | Transition to `UNDER_REVIEW`; status mapping used by frontend. |
| `POST /api/recruiter/applications/{applicationId}/shortlist` | `{}` or `{ "reason": "..." }` | Transition to `SHORTLISTED`; define duplicate/invalid transition behavior. |
| `POST /api/recruiter/applications/{applicationId}/interview` | `{}` or `{ "reason": "..." }` | Transition to `INTERVIEW`; confirm whether interview details are required in a separate schema. |
| `POST /api/recruiter/applications/{applicationId}/hire` | `{}` or `{ "reason": "..." }` | Transition to `HIRED`; define valid prior states and audit notification behavior. |
| `POST /api/recruiter/applications/{applicationId}/reject` | `{}` or `{ "reason": "..." }` | Transition to `REJECTED`; define whether reason is required and candidate notification behavior. |

Frontend maps UI statuses `UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `HIRED`, `REJECTED` to these action routes. Confirm canonical application status values and allowed state machine.

### 5.3 Candidate search, profile access and shortlist

| Method and endpoint | Frontend request | Response / behavior needed; comparison |
|---|---|---|
| `GET /api/recruiter/candidates` | Query: `query`, `specialty`, `location`, `minExperience`, `openToWork`, `page`, `pageSize` | Return only discoverable candidates and accurate pagination total for active filters. Earlier comparison says filters combine with AND, specialty exact, location matches city/state. Confirm `minExperience` units/boundary and `openToWork` type. Frontend does not send `maxExperience`, `licenseState`, `employment`, or `availability`. |
| `GET /api/recruiter/candidates/{candidateId}` | None | Return candidate professional summary and profile fields flat under `data`; contact data masked while locked. A sample shape follows. |
| `POST /api/recruiter/candidates/{candidateId}/unlock` | JSON `{}` plus required `Idempotency-Key` header | Atomically charge unlock cost and grant organization access. On success frontend refetches detail and separately refreshes credits. Return success/access state; do not assume this returns the new balance. |
| `GET /api/recruiter/candidates/{candidateId}/resumes/{resumeId}/download` | Authenticated GET | Protected stream or short-lived private link; verify organization unlock and resume ownership/availability on every request. |
| `GET /api/recruiter/purchased-candidates` | Pagination/filter query | Return candidates unlocked by authenticated organization. Confirm whether pagination total counts unique successful unlocks. |
| `GET /api/recruiter/shortlisted-candidates` | Pagination/filter query | Return organization-scoped shortlist and accurate total. |
| `POST /api/recruiter/shortlisted-candidates` | `{ "candidateId": "<candidate-id>" }` | Add shortlist (optional `notes` is documented in earlier comparison); define duplicate handling and whether locking is required. |
| `DELETE /api/recruiter/shortlisted-candidates/{candidateId}` | None | Remove only this organization’s shortlist entry; define idempotency/204. |

#### Candidate detail privacy contract

Before unlock, professional fields such as title, summary, skills, work history and career preferences may be returned without blur. Contact fields must not be returned unmasked. After successful unlock, the frontend refetches candidate detail; only then should permitted contact fields and resume entries/links be returned. Candidate resume downloads must use the protected download route and returned resume ID.

```json
{
  "success": true,
  "data": {
    "candidateId": "<candidate-id>",
    "currentJobTitle": "<professional-title>",
    "professionalSummary": "<summary-or-null>",
    "skills": ["<skill>"],
    "workExperience": [
      {
        "jobTitle": "<job-title>",
        "employerName": "<employer>",
        "employmentType": "FULL_TIME",
        "location": "<location>",
        "startMonth": "<month>",
        "startYear": 2022,
        "endMonth": null,
        "endYear": null,
        "currentlyWorking": true,
        "description": "<description>"
      }
    ],
    "careerPreferences": {
      "employmentTypes": ["FULL_TIME"],
      "preferredLocations": ["<location>"],
      "shiftPreference": ["DAY"],
      "expectedSalary": null
    },
    "unlocked": false
  }
}
```

All values above are placeholders. Fields may be null/omitted only where the canonical schema says so. The current handoff specifically asks for the flat `data` shape; do not require nested `{ candidate, profile, access, creditBalance }` unless frontend and backend agree to change it.

Candidate search cards should use stable IDs accepted by detail/shortlist routes and return accurate title, specialty, experience, city/state, availability, skills, `unlocked`, and `shortlisted`. Credential badges require a real `credentialsVerified` boolean or documented `credentialStatus`; do not infer credential verification from profile completion or organization verification.

### 5.4 Plans, credits, checkout and payments

| Method and endpoint | Frontend request | Response / behavior needed; comparison |
|---|---|---|
| `GET /api/recruiter/plans` | None | Return active plan catalog, stable plan IDs, credits, price, currency, duration and availability. Empty plans must be an explicit empty array. |
| `GET /api/recruiter/credits` | None | Earlier minimum shape: `availableCredits`, `unlockCost`, `ledger`. Define whether total/used credits, reserved, promotional, expired and pending credits are included. Verification gating must be explicit. |
| `POST /api/recruiter/checkout` | `{ "planId": "...", "successUrl": "...", "cancelUrl": "..." }` | Return checkout session. With no provider configured, earlier contract says `providerConfigured:false`, `checkoutUrl:null`, and `PROVIDER_NOT_CONFIGURED`; never provide an invalid URL or create a payment. With provider configured, use an absolute HTTPS checkout URL. Frontend sends an idempotency header when supplied. |
| `GET /api/recruiter/checkout/{sessionId}` | None | Return authoritative checkout/payment status; frontend uses it for checkout result handling. Define states and ownership. |
| `GET /api/recruiter/payment-history` | Query filters/pagination | Return organization-scoped payment/transaction records and pagination. Define statuses, currency, totals and ordering. |
| `GET /api/recruiter/payment-history/{transactionId}/invoice` | None | Return invoice metadata or protected file; define content type, filename, authorization and not-ready behavior. |

### 5.5 Organization verification documents

| Method and endpoint | Frontend request | Response / behavior needed; comparison |
|---|---|---|
| `GET /api/recruiter/organization/documents` | Authenticated GET | List authenticated organization’s documents with stable IDs, document type, filename, MIME/size, upload time and review state. Canonical list envelope needs confirmation. |
| `POST /api/recruiter/organization/documents` | Multipart fields `documentType` and `document` | Earlier contract lists types `REGISTRATION_CERTIFICATE`, `BUSINESS_LICENSE`, `TAX_ID`, `ACCREDITATION`, `OTHER`; accepted formats PDF/JPEG/PNG up to 10 MiB. Organization may be `PENDING` or `REJECTED`; caller must be active OWNER/ADMIN document manager. |
| `DELETE /api/recruiter/organization/documents/{documentId}` | None | Delete only authorized organization document; define whether deletion is allowed after review and return status/204. |

Known integration gap from existing handoff: a screenshot showed “Active organization membership required” during upload, but did not include HTTP status or response body. Registration must create active OWNER membership linked to the pending organization, or backend must document the required activation procedure. This message alone does not establish a file-format defect. Backend must provide the sanitized error and a successful pending-organization upload/list example.

## 6. Comparison findings and backend decisions required

These are the highest-impact unresolved issues found across the candidate/recruiter handoffs. They are not claims of a live backend failure unless explicitly identified above.

| Priority | Area | Comparison / missing contract | Backend decision or deliverable |
|---|---|---|---|
| Resolved in frontend handoff | Candidate preferences | Screenshot uses stale `HOSPITAL` and `YEARLY`; API examples and frontend mapper use `ONSITE` and `ANNUAL`. | Canonical API example documented; frontend mapper already matches. Backend should still supply a sanitized deployed response for runtime confirmation. |
| Blocker | Password reset | `verify-code` and `reset-password` grant/token handoff is undefined. | Document complete sequence and single-use grant behavior. |
| Blocker | Recruiter verification upload | Existing screenshot indicates active membership authorization rejection; registration membership creation/activation unconfirmed. | Confirm/create active OWNER membership on registration; provide actual status/code/body and successful pending-state upload. |
| High | Recruiter dashboard | Dashboard DTO, metric definitions and activity feed are incomplete/service-defined. Search UI currently loads list on mount and can filter locally. | Canonical DTO, periods, metric definitions; count explicit searches, not raw GET requests. Return real activity only, newest first, stable IDs. |
| High | Recruiter candidate access | Detail and search identifiers/fields have had documented shape differences. | Confirm stable candidate ID, flat detail shape, accurate summary fields, locked/unlocked privacy, and protected resume route. |
| High | Recruiter team | Existing team GET documents membership pagination only; page needs persisted pending invites/seats. | Add canonical `pendingInvitations` and `seats`; define seat reservation, invitation expiration and duplicate handling. |
| High | Invitation acceptance | Email token was reported as not clickable; acceptance path needs exact lifecycle. | Email URL to `/accept-invitation?token=...`; confirm preview/acceptance expiry, single-use and password behavior. |
| High | Candidate data export | Export response type remains unconfirmed; account deletion is `202` with `accountStatus: INACTIVE` and the frontend sends no body. | Define export response content type, filename and URL expiry. Confirm account retention/anonymization policy. |
| Medium | Hospital profile | UI has organization/contact fields not captured on signup and current API example does not establish all values. | Publish canonical organization profile shape, editable fields and source-of-truth mapping. |
| Medium | Public support form | Frontend posts `/support/contact`; another handoff references `/support/tickets` and different fields. | Select canonical route/schema, rate limit/honeypot and admin queue behavior. |
| Medium | Job/application rules | Active job edit constraints and application state transitions need an explicit state machine. | Publish enums, valid transitions, close behavior, salary currency/period and error codes. |
| Medium | Responses and errors | Frontend supports multiple response aliases to tolerate changing contracts. | Publish one success/error envelope, list pagination standard, status codes and request ID policy. |

## 7. Security, authorization and data-integrity requirements

1. Derive candidate identity from the verified token; derive recruiter organization from active membership, never from an untrusted organization ID in the request.
2. Enforce role, account state, email verification and organization verification gates server-side. Return explicit error code/status for each gate.
3. Ensure candidate-owned profile, application, resume, photo, export and account operations cannot access another candidate’s data.
4. Keep locked candidate contact data masked/absent; protect resume metadata/downloads consistently before and after unlock.
5. Charge credits and create unlock access atomically. Enforce `Idempotency-Key` for unlock and checkout side effects.
6. Validate uploads by file content as well as extension/MIME/size, scan/quarantine files, store privately and use authenticated download or expiring links.
7. Recalculate completion, profile strength, privacy, verification and eligibility server-side; do not trust client status values.
8. Use stable pagination totals and predictable validation errors. Do not convert missing values into success-shaped zeros where “unavailable” is distinct.
9. Audit sensitive operations (unlock, payment, document review, account deletion/export) without logging passwords, tokens or unnecessary PII.

## 8. Backend handoff checklist

Please return the following to complete integration:

- [ ] OpenAPI (or equivalent) covering every endpoint in this document, including methods, auth, query/path/header/body schemas, required/optional/null behavior, enums and limits, success response schemas/examples, error schemas/status codes, pagination, and mutation side effects/idempotency.
- [ ] Sanitized request **and** response examples for every operation in this inventory, including representative 401/403, validation, not-found and conflict responses where applicable. Do not leave endpoints documented only as prose.
- [ ] Canonical enum lists and field nullability, especially candidate preferences.
- [ ] Sanitized deployed examples for login, candidate profile/preferences, candidate dashboard, job search/application, recruiter dashboard, candidate search/detail before and after unlock, recruiter team, credits, checkout, organization profile and document upload/list.
- [ ] Pagination, timestamps, money/currency, error envelope and request-ID conventions.
- [ ] Exact verification/auth eligibility matrix for candidate, recruiter and organization states.
- [ ] Invitation lifecycle and email URL example; team seat/invitation semantics.
- [ ] Confirmation of active recruiter OWNER membership creation during registration.
- [ ] Definitions for dashboard metrics, activity event sources and candidate discoverability.
- [ ] Candidate export/deletion and password-reset/change-email flow decisions.
- [ ] Staging base URL, CORS/session settings and role-specific test accounts with representative non-sensitive records.

## 9. Frontend source map

- Candidate onboarding/profile API: `src/lib/candidateProfileApi.js`
- Candidate dashboard, jobs, applications, saved jobs and privacy API: `src/lib/candidateDashboardApi.js`
- Recruiter jobs, candidates, team, payments, organization and documents API: `src/lib/recruiterApi.js`
- Shared auth/session: `src/lib/authApi.js`, `src/lib/recruiterAuthApi.js`, `src/lib/http.js`
- Public jobs/contact: `src/lib/publicApi.js`
- Shared notifications: `src/lib/notificationsApi.js`
- Existing candidate handoff: `docs/handoff-documents/candidate-backend-handoff.md`
- Existing mismatch/comparison source: `2026-10-19-backend-api-mismatches/`
- Recruiter focused handoffs: `2026-10-21-recruiter-dashboard-backend-handoff/`, `2026-10-21-recruiter-document-upload-backend-handoff/`, `2026-10-21-hospital-pending-verification-backend-handoff/`, `2026-10-21-recruiter-team-api-handoff/`
