# MedHire frontend API cross-check

**Date:** 26 October 2026  
**Compared:** MedHire candidate/recruiter frontend, `D:\cv2026\adminportal2026`, and `C:\Users\HP\Downloads\MEDHIRE_ALL_APIS_REQUEST_RESPONSE_EXAMPLES.md`

## Evidence and response provenance

The supplied examples document says its examples are fictional and do not assert that IDs or records exist in a deployed environment. It also marks many response bodies as requiring runtime verification. No backend source, staging credentials, or captured HTTP traces are present in the two frontend repositories. As a result, this review preserves documented request/status/example information but **does not label any example as an actual deployed backend response**. For entries marked `UNCONFIRMED`, the actual sanitized response body must be captured from staging before this handoff can claim a complete wire trace.

For protected recruiter API calls, the frontend sends `Authorization: Bearer <access-token>`; `recruiterApi.request` also sends `Accept: application/json`, and JSON mutations send `Content-Type: application/json`. Auth calls set JSON content type; calls using `authApi` attach a bearer token if one is present. The frontend sends `Idempotency-Key` for recruiter candidate unlock and only when a caller supplies a checkout idempotency key. Multipart upload calls let the browser set the boundary. The examples reference documents a shared `Accept: application/json` convention; no bearer tokens are reproduced below.

`<api-base-url>` stands for the configured `VITE_API_BASE_URL` (default `/api`). Path IDs and query values below are sanitized illustrative values. Query parameter order is not significant. List loaders initially request `page=1&pageSize=100` and follow `pagination.totalPages`; calls with filters add the filters supplied by the UI.

## Recruiter portal endpoints used by the frontend

In the response column, a concrete JSON shown by the supplied document is identified as a **documented fictional example**. `UNCONFIRMED` means the document explicitly did not provide a complete stable response body; no actual backend response was supplied to replace it. Bodies from fictional examples are intentionally not relabeled as observed backend traffic.

| Frontend operation | Request sent by frontend (sanitized) | Supplied document response / comparison |
|---|---|---|
| `POST /api/auth/register` recruiter registration | JSON headers; body keys: `role`, `fullName`, `email`, `phone`, `designation`, `organizationName`, `organizationWebsite`, `city`, `state`, `password`, `termsAccepted`. Values normalized in `recruiterAuthApi.js` (email lower-case, phone `+91` plus digits). | Doc's auth registration example only covers candidate fields. **Mismatch/incomplete:** no recruiter request example or recruiter registration response example. |
| `POST /api/auth/login` | `email`, `password`, `rememberMe`; JSON headers, no bearer token. | HTTP `200`; body marked **UNCONFIRMED** in supplied document. The static source contract summary names token fields but isn't an actual response body. |
| `POST /api/auth/verify-code` | `{ "email": "<email>", "code": "<code>", "purpose": "registration" }`; JSON headers, no bearer token. | HTTP `200`; body marked **UNCONFIRMED**; purpose-dependent source contract. |
| `POST /api/auth/resend-code` | `{ "email": "<email>", "purpose": "registration" }`; JSON headers, no bearer token. | HTTP `200`; body marked **UNCONFIRMED**; source note says purpose-dependent and password-reset response is non-enumerating. |
| `POST /api/auth/forgot-password` | `{ "email": "<email>" }`; JSON headers, no bearer token. | HTTP `202`; documented fictional body: `{ "message": "If an account exists, reset instructions have been sent." }`. |
| `POST /api/auth/reset-password` | `{ "email": "<email>", "resetToken": "<resetToken>", "newPassword": "<redacted>" }`; JSON headers, no bearer token. | HTTP `200`; documented fictional body: `{ "message": "Password reset successfully" }`. |
| `POST /api/auth/logout` | `{ "refreshToken": "<refreshToken>" }`; JSON headers; bearer token is added when available; credentials included. | HTTP `200`; documented fictional body: `{ "message": "Logged out successfully." }`. |
| `GET /api/auth/invitations/{token}` | Path token is URL encoded; no body; public request. | HTTP `200`; body marked **UNCONFIRMED**. |
| `POST /api/auth/accept-invite` | `{ "token": "<invitationToken>", "password": "<redacted>", "fullName": "<name>" }` (fullName may be absent); JSON headers. | HTTP `200`; documented fictional body has `data.user` with `id`, `role`, `fullName`, `email`, `emailVerified`. |
| `GET /api/auth/me` | No body; bearer token. Called by pending-verification UI. | HTTP `200`; documented fictional body has `data.user` with `id`, `role`, `fullName`, `email`, `emailVerified`. |
| `PATCH /api/auth/change-password` | `{ "currentPassword": "<redacted>", "newPassword": "<redacted>" }`; JSON and bearer headers. | HTTP `200`; documented fictional body: `{ "message": "Password changed successfully. Please sign in again." }`. |
| `POST /api/auth/change-email` | Frontend sends `{ "newEmail": "<email>" }`; JSON and bearer headers. | HTTP `202`; doc example shows `{ "newEmail": "<email>" }`, returns a message and `data.expiresAt`. **Potential mismatch with the earlier handoff:** that handoff lists `password`, but this frontend call does not send it. Confirm the backend's required schema. |
| `POST /api/auth/change-email/confirm` | `{ "token": "<confirmation-code-or-token>" }`; JSON and bearer headers. | HTTP `200`; documented fictional body returns updated user and message. Frontend passes the UI code as token; confirm expected token type. |
| `GET /api/notifications?page=1&pageSize=10` | Bearer token; `Accept: application/json`; no body. Recruiter notification bell makes this request. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/notifications/unread-count` | Bearer token; `Accept: application/json`; no body. | HTTP `200`; body **UNCONFIRMED**. |
| `PATCH /api/notifications/{notificationId}/read` | No body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `PATCH /api/notifications/read-all` | No body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/dashboard` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/plans` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/hospital-profile` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `PATCH /api/recruiter/hospital-profile` | Sends flat JSON keys `name`, `website`, `phone`, `address`, `city`, `state`, `postalCode`, `country`, `registrationNumber`, optional `description`, and `hiringPreferences: { specialties: [] }`; bearer token. | HTTP `200`; body **UNCONFIRMED**. Aligned to documented backend names. Location and employment hiring preferences are not sent because the backend example does not confirm them. |
| `GET /api/recruiter/organization/documents` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/organization/documents` | `multipart/form-data` fields `documentType` and `document`; browser-generated boundary; bearer token. | HTTP `201`; body **UNCONFIRMED**. The frontend sends the file field named `document`. |
| `DELETE /api/recruiter/organization/documents/{documentId}` | No body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/organization/resubmit` | `{ "notes": "<notes>" }`; JSON headers; bearer token. | HTTP `202`; body **UNCONFIRMED**. Aligned to documented request field. |
| `GET /api/recruiter/team` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/team/invitations` | `{ "email": "<email>", "fullName": "<name>" }`; JSON headers; bearer token. | HTTP `201`; body **UNCONFIRMED**. |
| `DELETE /api/recruiter/team/{userId}` | No body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/jobs` | `?page=1&pageSize=100`; UI currently calls without filters; bearer token. | HTTP `200`; body **UNCONFIRMED**. Query/filter definitions and allowed values aren't concretely supplied in the examples document. |
| `POST /api/recruiter/jobs` | JSON fields from `toJobPayload`: `title`, `description`, `location`, `specialty`, normalized `employmentType`, `workSetting` (defaults `ONSITE`), numeric `salaryMin`/`salaryMax` parsed from salaryRange; `requirements` is folded into description and `salaryRange` itself is removed. | HTTP `201`; documented fictional JSON response has `data.jobId`, title/description, `status: PENDING_APPROVAL`, location, specialty, employmentType, workSetting, salaryMin/salaryMax and timestamps. **Mismatch risk:** supplied source example says server accepts `title`/`description` and optional salary bounds, not `salaryRange` or `requirements`; adapter transforms these before sending. Confirm exact outgoing request for each form input. |
| `PATCH /api/recruiter/jobs/{jobId}` | JSON after the same `toJobPayload` conversion; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/jobs/{jobId}/close` | `{ "reason": "Position has been filled." }` by default; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. Aligned to documented request field. |
| `GET /api/recruiter/jobs/{jobId}/applications` | `?page=1&pageSize=100`; current callers do not pass filters; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/applications/{applicationId}` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/applications/{applicationId}/review` | `{}`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/applications/{applicationId}/shortlist` | `{}`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/applications/{applicationId}/interview` | `{}`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/applications/{applicationId}/hire` | `{}`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/applications/{applicationId}/reject` | `{ "reason": "<reason>" }` only when caller supplies a reason; otherwise `{}`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. The documented example includes a reason. |
| `GET /api/recruiter/candidates` | No query string in current UI call (`searchCandidates()`); bearer token. The filter controls are currently applied to the loaded directory in the UI. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/candidates/{candidateId}` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/candidates/{candidateId}/unlock` | `{}`; JSON headers; bearer token; `Idempotency-Key: <generated-key>`. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/candidates/{candidateId}/resumes/{resumeId}/download` | No body; bearer token. `Accept: */*`; optional query `preview=true` is not currently appended by `downloadCandidateResume`. | HTTP `200`, binary response (not JSON); documented source contract says MIME type and private/no-store cache headers. Stream failure may be HTTP `500` with `RESUME_STREAM_ERROR`. |
| `GET /api/recruiter/purchased-candidates` | Main page: `?page=1&pageSize=100`; dashboard count call: `?page=1&pageSize=1`; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/shortlisted-candidates` | `?page=1&pageSize=100`; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/shortlisted-candidates` | `{ "candidateId": "<candidateId>" }`; JSON headers; bearer token. | HTTP `201`; body **UNCONFIRMED**. **Difference:** documented example includes optional `notes`; frontend does not send it. |
| `DELETE /api/recruiter/shortlisted-candidates/{candidateId}` | No body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/credits` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `POST /api/recruiter/checkout` | `{ "planId": "<planId>", "idempotencyKey": "<uuid>" }`; JSON headers; bearer token. | HTTP `200`; body **UNCONFIRMED**. Aligned to the spreadsheet's JSON-body idempotency contract; callback URLs are omitted. |
| `GET /api/recruiter/checkout/{sessionId}` | No query/body; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/payment-history` | Query contains non-empty filters supplied by UI; bearer token. | HTTP `200`; body **UNCONFIRMED**. |
| `GET /api/recruiter/payment-history/{transactionId}/invoice` | No body; bearer token. | HTTP `200`; body/format **UNCONFIRMED** (document says named service result, but does not establish whether JSON metadata or file bytes). |

### Recruiter endpoints listed by the examples document but not called by `src/lib/recruiterApi.js`

`GET /api/recruiter/jobs/{jobId}`, `POST /api/recruiter/jobs/{jobId}/remove`, `POST /api/recruiter/shortlisted-candidates/{candidateId}`, `GET /api/recruiter/checkout/{sessionId}/status`, and `POST /api/recruiter/webhooks/payment` appear in the examples reference but have no corresponding call in `src/lib/recruiterApi.js`. Confirm whether they are used by another client or are backend-only routes; do not count them as frontend-used endpoints on this evidence.

## Recruiter mismatches resolved in frontend

1. **Hospital profile request:** `recruiterApi.js` now flattens the UI model and maps `hospitalName`→`name`, `hospitalPhone`→`phone`, and `postal`→`postalCode`. It sends only confirmed `hiringPreferences.specialties`; locations and employment types display read-only until backend confirms their write support.
2. **Organization resubmission:** sends `{ "notes": "..." }`.
3. **Close job:** sends `{ "reason": "Position has been filled." }` by default.
4. **Checkout:** sends `{ "planId": "...", "idempotencyKey": "<uuid>" }` in JSON; callback URLs and the idempotency header were removed from this UI call.
5. **Shortlist notes:** `notes` is optional in the documented body; the UI's current add action only has candidate ID and sends that field.
6. **Unconfirmed outputs:** most recruiter endpoint response bodies remain runtime-unconfirmed. Obtain sanitized staging traces before declaring response schemas matched.

## Candidate API mismatch rows applied or confirmed

| Spreadsheet row | Current frontend behavior |
|---|---|
| Auth change email | Already sends only `{ "newEmail": "..." }`; no change needed. |
| Personal information | Omits `gender`, `address`, and auth-owned `email`; sends fields in the documented backend example. |
| Education | Omits frontend-only row `id`; sends numeric `graduationYear`. |
| Work experience | Omits local row `id`; serializes month/year fields as numbers and omits end date fields for current roles. |
| Skills response | Adapter accepts a bare array response as the canonical skill list. |
| Account deletion | Sends no body; UI describes the action as deactivation. The API's accepted `202` response returns `accountStatus: INACTIVE`. |
| Preferences | Existing mapper already uses `ONSITE`, `ANNUAL`, and scalar `remotePreference`; kept unchanged. The screenshot's `HOSPITAL`/`YEARLY` values are corrected in the main handoff. |
| Job close | See recruiter list above; request now includes the backend's `reason` field. |

## Admin portal cross-check (`D:\cv2026\adminportal2026`)

The admin frontend uses the standard API client, so authenticated requests carry `Accept: application/json` and `Authorization: Bearer <redacted>`; JSON mutations also carry `Content-Type: application/json`. List reads use `page=1&pageSize=100`, following pages when pagination says more exist. The admin examples document includes many of these routes but marks most response bodies runtime-unconfirmed.

| Admin UI call | Frontend request detail | Cross-check result |
|---|---|---|
| `POST /api/auth/login`, forgot/reset/verify, invitation preview/accept, logout, refresh | Shared auth requests via `src/services/authService.js`; refresh is automatic after a 401, with `withCredentials`. | Auth examples generally align in route/method. Verify request required fields against actual UI forms; invitation preview is documented with an unconfirmed response. |
| `GET /api/admin/candidates`, `/admin/recruiters`, `/admin/hospitals`, `/admin/resumes/pending`, `/admin/payments`, `/admin/unlock-history`, `/admin/plans`, `/admin/audit-logs`, `/admin/jobs`, `/admin/notifications`, `/admin/support-tickets`, `/admin/staff`, `/admin/roles` | Paginated list loader uses `page` and `pageSize=100`; bearer token. | Routes are present in the examples doc; response bodies are mostly marked **UNCONFIRMED**. |
| Admin job moderation | Admin UI now calls `POST /api/admin/jobs/{id}/approve`, `/reject`, `/close`, or `/remove`; body is `{}` for approve/close and `{ "reason": "..." }` for reject/remove. | Uses the dedicated routes and payloads listed in the API examples instead of sending UI status labels to `/status`. |
| `PATCH /api/admin/notifications/{id}/read` | No body (Axios `.patch(path)`); bearer token. | **Mismatch:** reference shows an empty JSON object body for this operation. Backend should accept no body or frontend should send `{}` consistently. |
| `POST /api/admin/notifications/mark-all-read` | No body; bearer token. | Reference documents both `PATCH` and `POST` variants. Frontend uses `POST`; confirm canonical route/method. |
| `PATCH /api/admin/support-tickets/{id}/status`, `/assignment`, `/priority`; `POST .../replies` | Body keys: `status`; `adminId` (nullable); `priority`; `{ "message": "..." }` respectively. | Routes and fields align with examples. Responses unconfirmed. |
| `POST /api/admin/staff` | `{ "fullName": "<name>", "email": "<email>", "adminLevel": "<level>" }` | Example uses same keys; HTTP `201` documented, response body unconfirmed. |
| `PATCH /api/admin/staff/{id}` | Sends `adminLevel` when role changes and/or uppercase `status`. | **Mismatch/incomplete example:** reference PATCH example shows only `status`; backend contract must include `adminLevel`. |
| `PATCH /api/admin/staff/{id}/permissions` | `{ "overrides": { "<permission>": true } }` | Matches documented request shape; response unconfirmed. |
| `POST /api/admin/plans` | Sends `name`, numeric `priceMinor`, `currency`, `billingInterval`, `credits`, `jobPosts`, `recruiterSeats`, `validityDays`, `features: string[]`, `autoRenew`, and `active`. | Aligned with the spreadsheet. UI now exposes create-only features and auto-renew inputs. |
| `PATCH /api/admin/plans/{id}` | Sends `name`, numeric `priceMinor`, `currency`, `credits`, and `active`. | Aligned with backend update fields; billing interval, jobPosts, recruiterSeats, validityDays, features, and autoRenew are read-only in edit mode because the spreadsheet does not list them as accepted update fields. |
| `POST /api/admin/payments/{transactionId}/refund` | Sends numeric `amount`, `reason`, and `idempotencyKey` in JSON body. | Aligned with spreadsheet; removed the `Idempotency-Key` header. |
| `PATCH /api/admin/settings` | Sends `platformName`, `supportEmail`, `maintenanceMode`, numeric `resumeMaxSizeMb`, numeric `otpExpiryMinutes`, numeric `otpResendCooldownSeconds`, and numeric `jobExpiryDays`. | `resumeMaxSizeMb` already uses the backend field name. Spreadsheet says other keys need backend confirmation; currency is not editable in this form. |
| `POST /api/admin/organizations/{id}/credits/adjust` | `{ "delta": <number>, "reason": "<reason>" }`; `Idempotency-Key: <generated-key>`. | Reference request has same body; confirm it documents/requires the idempotency header. |
| `GET /api/admin/revenue` | `?startDate=<date>&endDate=<date>&groupBy=month` (blank dates omitted). | Reference route exists; confirm query names and response for chart series. |
| `GET /api/admin/recruiters/{userId}`, `GET /api/admin/organizations/pending`, `GET /api/admin/hospitals/{organizationId}`, `GET /api/admin/organizations/{organizationId}/documents`, `POST /api/admin/organizations/{organizationId}/verify`, `POST /api/admin/organizations/{organizationId}/reject` | Verification UI loads recruiter, resolves organization, then loads profile/docs. Approval sends `{ "decision": "APPROVED" }` to `/verify`; rejection sends `{ "reason": "..." }` to `/reject`. | Rejection now uses the separate backend route instead of `/verify`. **Cross-resource ID risk remains:** recruiter detail must return organization ID or pending-org lookup must reliably map user to organization UUID. |
| `GET /api/admin/resumes/{resumeId}`, `POST /api/admin/resumes/{resumeId}/review` | **Correction:** frontend uses `POST` for review. Approve sends `{ "decision": "APPROVED", "notes": "<notes>" }`; reject sends `{ "decision": "REJECTED", "reason": "<reason>" }`. | **Reject-body mismatch:** examples document has the approve `{decision, notes}` example; reject example is absent while UI sends `reason`. HTTP `200` is documented; response body unconfirmed. |
| `POST /api/admin/notifications/broadcast` | `{ "title": "<title>", "message": "<message>", "audience": "ALL_ADMINS" }` | Aligned; frontend supplies the required audience. |

The admin portal also imports placeholder pages and some routes may not call APIs from the current UI. This table covers API calls found in the active context/services and the verification, commerce, support, staff, and notification screens; it is not a claim that every one of the examples document's 67 admin routes is reachable in the UI.

## Required backend follow-up for a true request/response trace

For every `UNCONFIRMED` operation, capture from a non-production test account: timestamp/environment, method, full URL/query, sanitized request headers/body, HTTP status, response headers where relevant, and sanitized response body. Preserve exact field names, JSON types, and error codes. Replace names/emails/phones/addresses/tokens/IDs before attaching. Include at least one success and representative validation/authorization/conflict failure for mutations. Binary resume/invoice responses need content type, disposition, cache headers, and a redacted metadata summary; do not paste private file contents.
