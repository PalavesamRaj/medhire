# MedHire recruiter sanitized API traces

**Prepared:** 19 October 2026  
**Scope:** Issues with evidence in the supplied screenshots and existing recruiter mismatch handoff.

## Evidence limits

The evidence available here is UI screenshots and the existing handoff, not browser network exports or backend logs. Therefore exact HTTP statuses and response bodies, request IDs, and recruiter/organization account states are unavailable for most cases. They are marked **not captured** below rather than reconstructed. Request examples show only field names and fictional/redacted values; they are not claimed to be the exact captured requests. No credentials or personal data are included.

## Dashboard

- **Screen/action:** Open Recruiter Dashboard and inspect metrics, recommendations, recent activity, and organization summary.
- **Reproduction:** Sign in to the affected test recruiter account; navigate to `/recruiter/dashboard`.
- **Request:** `GET /recruiter/dashboard`; query parameters: none.
- **Request body:** None.
- **HTTP status / sanitized response:** Not captured. The mismatch is that the API reference describes this response as service-defined and does not define the dashboard DTO keys; no raw dashboard response was retained.
- **UI expected vs displayed:** UI expects candidate-search count, organization identity/status, recommended candidate fields, and recent-activity text/timestamp. Existing handoff says those dashboard fields cannot be reliably mapped from the unspecified response. Credits, purchased, and shortlisted totals are obtained through their documented endpoints.
- **Account state:** Recruiter active/email-verified state and organization verification state were not captured.

## Candidate search and detail

- **Screen/action:** Find Candidates; submit a search and open a candidate profile. Filter names follow the frontend request implementation.
- **Reproduction:** Navigate to `/recruiter/find-candidates`; submit a query or filter; select View Profile.
- **Requests (updated frontend):** `GET /recruiter/candidates?query=<fictional-query>&specialty=<fictional-specialty>&location=<fictional-location>&minExperience=1&openToWork=true&page=1&pageSize=20`; then `GET /recruiter/candidates/{candidateId}`. Values shown are illustrative; unset filters may be omitted by query serialization. The list request has no body. The frontend does not send `maxExperience`, `licenseState`, `employment`, or `availability`.
- **HTTP status / sanitized response:** Not captured. No sanitized raw list/detail JSON or exact status is available. The handoff records screenshots with generic/fallback card titles and limited visible data; experience filtering returned no matches when summary experience was unusable. One screenshot showed a UUID in the profile URL. These observations do not establish the exact response body or prove which fields were absent versus mapped differently.
- **UI expected vs displayed:** The design card presents initials, professional title, specialty, verified-credentials badge, candidate ID, experience, location, education, license, availability, tags, and an unlocked state/action. Runtime evidence shows generic/fallback titles and only limited details. The updated frontend maps `candidateId`, `currentJobTitle`, `yearsOfExperience`, `specialty`, and `city` + `state`. The design's count (248) and candidate details are sample data, not a live expected total. The mismatch handoff separately records that the current DTO contract lacks an explicit credential verification flag.
- **Account state:** Not captured.

## Team invitation

- **Screen/action:** Team page; submit an invitation and inspect the invitation email and team list.
- **Reproduction:** Navigate to `/recruiter/team`; submit the invite form; inspect the received message and reload the team list.
- **Request:** `POST /recruiter/team/invitations`.
- **Request body (illustrative only):** `{"fullName":"[REDACTED]","email":"invitee@example.invalid","designation":"[REDACTED]"}`. This is a sanitized shape, not a captured payload; `example.invalid` is reserved for examples.
- **HTTP status / sanitized response:** Not captured. The handoff reports the email showed a standalone one-time token without a clickable acceptance URL and the subsequent team UI showed `Invited (0)` because pending invite/seat data was unavailable or not recognized. Raw email content, response status/body, and `GET /recruiter/team` response were not retained. No token is reproduced here.
- **UI expected vs displayed:** UI needs an invitation persisted with a pending state, a clickable acceptance path, and team/seat data. Observed display was `Invited (0)`; acceptance route/token lifecycle is undefined in the current frontend contract.
- **Account state:** Inviting recruiter and organization state were not captured. Invitee identity is redacted.

## Plans and checkout

- **Screen/action:** Open Plans & Credits, choose a plan, then start checkout.
- **Reproduction:** Navigate to `/recruiter/plans-credits`; choose an available plan and continue to checkout.
- **Requests:** `GET /recruiter/plans`; `GET /recruiter/credits`; then `POST /recruiter/checkout`. No query parameters are documented for the first two. Checkout body shape/status were not captured; use `[selected-plan-id]` as a redacted placeholder only if preparing a local reproduction.
- **HTTP status / sanitized response:** Not captured. Screenshot evidence records missing plan cards/balance on Plans & Credits and the browser error `Failed to construct 'URL': Invalid URL` at checkout. The response body containing the invalid/missing URL was not retained; do not infer a status or response schema from the browser error.
- **UI expected vs displayed:** UI expects plan cards and a credit balance, then an absolute HTTPS checkout provider URL. Observed was no cards/missing balance and URL construction failure after selecting a plan.
- **Account state:** Not captured.

## Hospital profile read and save

- **Screen/action:** Open Hospital Profile; inspect organization/contact/verification/preferences; edit fields and save.
- **Reproduction:** Navigate to `/recruiter/hospital-profile`; edit organization type, registration/contact/address fields; save; inspect the follow-up GET/rendered values.
- **Requests:** `GET /recruiter/hospital-profile`; `PATCH /recruiter/hospital-profile`; then `GET /recruiter/hospital-profile`. Query parameters: none.
- **Request body (illustrative only):** `{"profile":{"organizationType":"[fictional-type]","registrationNumber":"[REDACTED]","contactEmail":"[REDACTED]","hospitalPhone":"[REDACTED]","address":"[REDACTED]","postal":"[REDACTED]","country":"[fictional-country]"},"hiringPreferences":{"specialties":[],"locations":[],"employmentTypes":[]}}`. This illustrates documented field names only; it is not a captured body.
- **HTTP status / sanitized response:** Not captured. Existing handoff records a blank profile/verification/preferences screenshot and a read-after-write mismatch where the follow-up GET returned blanks after editing. The PATCH response and both GET response bodies/statuses were not retained. The observation does not establish whether PATCH rejected, ignored, or persisted the values while GET omitted them.
- **UI expected vs displayed:** UI expects profile fields and verification/preferences to render; after save, it expects a fresh GET to contain the submitted values. Observed fields were blank/unavailable, and the handoff says saved values differed from the follow-up GET.
- **Account state:** Organization approval state was not captured; it may affect editable legal fields. Recruiter active/email-verified state was not captured.

## Active job edit / re-review

- **Screen/action:** Edit an active job and save a change.
- **Reproduction:** Navigate to Job Postings; edit a job whose status is `ACTIVE`; save.
- **Request:** `PATCH /recruiter/jobs/{jobId}`; query parameters: none.
- **Request body (current frontend shape, with redacted values):** `{"title":"[REDACTED]","specialty":"[REDACTED]","location":"[REDACTED]","employmentType":"[documented-enum]","salaryRange":"[REDACTED]","description":"[REDACTED]","requirements":["[REDACTED]"],"status":"PENDING_APPROVAL"}`. The frontend adds the status when it knows the edited job was active.
- **HTTP status / sanitized response:** The handoff records the API error text: `ACTIVE jobs cannot be edited by recruiters without a re-review flow.` Exact HTTP status and response JSON were not captured. The handoff does not establish that a later PATCH with `status: PENDING_APPROVAL` succeeded.
- **UI expected vs displayed:** Frontend now expects to submit active-job edits for review and displays “Job changes submitted for review.” The supplied handoff describes review for title, specialty, location, or salary changes, but the frontend currently submits every active-job edit with `PENDING_APPROVAL`. Backend acceptance and returned committed status remain unverified.
- **Account state:** Recruiter and organization state were not captured.

## Frontend behavior confirmation

- **Active-job re-review:** Yes. The frontend explicitly adds `status: "PENDING_APPROVAL"` to edits of active jobs and displays a review-submitted message. Whether the backend supports that transition is not verified.
- **Clickable invitation link:** Yes, the intended invitation flow needs one. Existing evidence says the received email contained a standalone token with no clickable URL; the frontend has no documented acceptance route. The acceptance URL format and endpoint need backend definition before implementation can be completed.
- **Hospital contact and organization-type fields:** Yes. The profile form submits `organizationType`, `contactEmail`, `hospitalPhone`, and related profile/address fields inside `profile`. The frontend then GETs the profile again and compares saved values. The read-after-write report indicates these values did not come back in the observed session; persistence and restrictions for approved organizations remain unverified.

## To complete capture with exact traces

For exact status/response evidence and account state, capture each request from the authorized test session's browser Network panel (with request/response headers, cookies, authorization, emails, names, IDs, and tokens removed). Record the recruiter's active/email-verification flags and the organization's state from a trusted account/admin view. The current workspace contains no HAR or raw API log from which those fields can safely be supplied.
