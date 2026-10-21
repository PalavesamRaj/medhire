# Backend questions and missing contracts

Prepared 19 October 2026 by comparing both frontends with the supplied API references. The source-verified contract supplement is treated as authoritative where it is more specific than an earlier proposed handoff. These items still need a backend decision or a deployable endpoint before the full cross-portal flow can be considered complete.

## API contract mismatches and incomplete flows to send to the backend team

These are contract questions, not assumptions about which side is wrong. The source-verified supplement takes precedence where it clarifies the other references.

| API / flow | What does not line up | What the backend team needs to confirm |
| --- | --- | --- |
| `POST /auth/verify-code` → `POST /auth/reset-password` | The reset endpoint requires `resetToken`, but the production verification response may omit it. That leaves candidate, recruiter, and admin password reset unable to complete. | Return a short-lived, single-use reset token in production, or document a reset-grant cookie/exchange endpoint and remove the required body token. |
| `POST /auth/change-email` → `POST /auth/change-email/confirm` | Start-change returns no confirmation value in production; confirm accepts `{token}`. It is unclear whether the email sends a code, a link token, or requires `/auth/verify-code` first. | Specify the exact user-entered value and the complete confirmation sequence for both portals. |
| Public contact submission | The source supplement says `POST /support/contact` with `email`, `subject`, `message`, optional `name`/`category`; the Admin Rev3 handoff describes `POST /support/tickets` and a different schema. | Select one public route and request schema, including spam honeypot/rate limit behavior, and confirm that submissions appear in admin support tickets. |
| `GET /candidates/me/data-export` | The API reference does not define JSON vs file stream vs signed URL; frontend currently creates a download from JSON. | Define response type, filename, content type, and signed URL expiry if applicable. |
| `DELETE /candidates/me/account` | Source supplement returns `INACTIVE`; another admin reference describes `DELETED` and masking. The UI can send the documented delete request but cannot infer retention and visibility behavior. | Confirm lifecycle status, retention/anonymization, token revocation, recruiter visibility, and how admin/application history displays the account. |
| `POST/PATCH /recruiter/jobs` | `salaryMin`/`salaryMax` have no specified currency or pay period, and the create contract does not clearly expose structured requirements while the UI collects them. | Confirm salary unit/currency and whether requirements are a supported field or belong in description. |
| Candidate profile country | The form has an `Other` option, but the verified validator expects uppercase two-letter country codes. The frontend omits this unsupported value. | Confirm accepted country values and whether an `OTHER` sentinel or free-text country is supported. |
| `GET /admin/organizations/{organizationId}/plans` | The admin Hospital Plans page calls this route, but the supplied admin endpoint inventory does not list it. | Confirm the route, permission, pagination, response schema, or the supported replacement. |
| Recruiter resume download | UI list/detail records may use a public candidate ID, while `GET /recruiter/candidates/{candidateId}/resumes/{resumeId}/download` is described as requiring UUIDs and organization ownership. | State which candidate ID field is the UUID used by the protected download endpoint and whether detail lookup accepts public IDs. |
| Recruiter candidate search/profile DTO | The documented search summary uses an `MH-...` candidate ID and includes title, specialty, experience, and location. The latest UI screenshot instead shows a UUID, `0.0`, and missing title/location; opening that ID shows the profile as unavailable. | Return the documented fields and a stable ID accepted by the detail and shortlist endpoints. Confirm whether that path ID is a public ID or UUID. Return the documented detail envelope `{ candidate, profile, access, creditBalance }` or provide the actual response schema and paired sanitized search/detail examples. |
| Recruiter job applicant summary | The applicants page used a candidate UUID as its fallback display name, while candidate identity is meant to stay masked until unlock. | Keep the candidate ID for actions, but return masked initials and professional summary fields. Confirm which candidate ID the profile route accepts. |
| Recruiter plans catalog | The Plans & Credits screenshot shows no plans and no visible balance. The frontend now accepts nested plan lists and balance values; if `/recruiter/plans` returns an empty `plans` array, the UI correctly has no purchasable plan to show. | Confirm the running plans endpoint returns the documented `{ plans, currentPlan }` shape and that at least one plan is active for the test organization. Return a sanitized response and confirm the exact available-credit field. |
| Recruiter checkout redirect | The checkout page loads plan details, but starting checkout fails to construct a URL from the response. | Return the documented `checkoutUrl` as an absolute HTTPS provider URL (and `checkoutSessionId`) from `POST /recruiter/checkout`; provide a sanitized response example. |
| Recruiter hospital profile response | The Hospital Profile screenshot renders organization, recruiter contact, verification, and hiring preferences as empty, with no request error. The frontend now unwraps nested responses and maps organization/recruiter/address aliases. | Return the documented `{ profile, verification, hiringPreferences }` envelope with the authenticated organization's saved fields, or provide the sanitized live response and exact field names. |
| Error and pagination envelopes | References use both `error.fields` and `error.details`; list pages need pagination metadata, but envelopes vary between `{data, pagination}` and nested `data.items`. | Publish a canonical field-error location and list envelope, including total/page count semantics. |

## Verification results (19 October 2026)

| Project | Result | What failed means |
| --- | --- | --- |
| `medhire-main` production build | Passed | Frontend compiled; this does not make HTTP requests to a backend. |
| `medhire-main` unit tests | 21 passed, 0 failed | Candidate profile/dashboard unit tests passed. |
| `medhire-main` browser check (`node --experimental-websocket tests/candidate-browser.mjs`) | Failed at Chrome DevTools `Page.enable` timeout | Browser automation could not establish its CDP connection. No backend API response was tested by this failure. |
| `adminportal2026` production build | Passed | Frontend compiled; this does not make HTTP requests to a backend. |
| `adminportal2026` Playwright (`npm run test:e2e`) | 15 passed, 27 failed | Failed checks were browser/UI assertions across candidate and resume screens, admin navigation, auth/recovery, recruiter/commerce, jobs/notifications/support/staff/settings/audit, and a direct-route login redirect. The existing admin handoff says the suite tests demo behavior and does not validate a backend. These failures are not verified API HTTP failures. |

**No API endpoint can currently be labeled “failed against the backend.”** Neither project was run against a supplied staging API with test accounts. The failures above identify frontend/browser checks that need review; backend acceptance requires a reachable staging base URL, CORS configuration, role-specific accounts, and representative records. Use the contract mismatches table above as the API questions for the backend team.

For staging smoke tests, these are the endpoint families behind the failed admin UI checks. They are **not** reported as server failures; verify their HTTP status and response bodies with the backend running:

- Auth: `POST /auth/login`, `/auth/forgot-password`, `/auth/verify-code`, `/auth/reset-password`.
- Candidate and resume screens: `GET /admin/candidates`, `/admin/candidates/{candidateId}`, `/admin/resumes/pending`, `/admin/resumes/{resumeId}`; candidate status and resume review mutations.
- Recruiter and organization screens: `GET /admin/recruiters`, `/admin/recruiters/{recruiterId}`, `/admin/hospitals`, `/admin/hospitals/{organizationId}`, `/admin/organizations/{organizationId}/documents`; organization verification mutations.
- Finance screens: `GET /admin/payments`, `/admin/payments/{transactionId}`, `/admin/plans`, `/admin/revenue`, `/admin/unlock-history`; plan and refund mutations.
- Operations screens: `GET /admin/jobs`, `/admin/notifications`, `/admin/support-tickets`, `/admin/staff`, `/admin/settings`, `/admin/audit-logs`; job, notification, ticket, staff, and settings mutations.
- Hospital Plans screen: `GET /admin/organizations/{organizationId}/plans` remains the explicit route missing from the supplied endpoint inventory.

## Please confirm or deliver

1. **Production password reset grant.** The auth reference says `POST /auth/reset-password` requires `resetToken`. The source-verified supplement says production `POST /auth/verify-code` returns reset authorization and expiry, but may omit `resetToken` outside mock mode. The current reset screen can continue only when it receives a usable grant. Please choose one production contract: return a short-lived, single-use reset token; issue an HttpOnly reset-grant cookie and remove the token body field; or provide another explicit grant exchange endpoint. Keep the grant single-use, short-lived, and bound to the verified email.

2. **Email change confirmation format.** `POST /auth/change-email` deliberately omits the confirmation value from its response, while `POST /auth/change-email/confirm` accepts `{ "token": "..." }`. The shared `verify-code` route also lists `email_change` as a purpose. Please confirm whether the email contains a six-digit code accepted as `token`, a link token, or a code that must first be exchanged through `verify-code`. The candidate and admin UIs currently submit the entered confirmation value to `/auth/change-email/confirm`.

3. **Public contact form route and payload.** The source-verified supplement specifies `POST /support/contact` with `email`, `subject`, and `message`, and optional `name`/`category`. The Admin revision 3 handoff describes `POST /support/tickets` with `name`, `email`, `phone`, `requesterRole`, `subject`, `message`, and a honeypot field. Please publish one route and schema, including the spam-trap behavior and rate limit, and ensure submissions appear in the admin ticket queue.

4. **Candidate data export result.** `GET /candidates/me/data-export` is listed, but its result is described as service-specific. Please define whether the endpoint returns JSON, a file stream, or a short-lived download URL; include filename/content type and expiry where applicable. The UI currently serializes a JSON response as a downloadable file.

5. **Candidate account deactivation semantics.** The source-verified supplement says `DELETE /candidates/me/account` returns `202` with `accountStatus: "INACTIVE"`; the admin revision 3 handoff describes deleted candidates as `DELETED` with masked personal data. Please confirm the canonical lifecycle state, retention/anonymization behavior, session revocation, recruiter visibility, and the status/name shown in admin and existing applications.

6. **Recruiter job salary units and structured requirements.** Job create/update accepts numeric `salaryMin`/`salaryMax` but does not specify currency, pay period, or a structured `requirements` field. Please confirm the salary currency and unit (the current recruiter form is INR-oriented), and whether requirements should remain part of `description` or be supported as a separate array in create, update, and detail responses.

7. **Candidate country values.** The candidate form offers an `Other` option, while the source-verified personal profile validator accepts only two-letter uppercase country codes. Please confirm support for all ISO 3166-1 alpha-2 values and whether a special `OTHER` value is allowed. Until confirmed, the frontend omits `country` when that legacy option is selected so it does not submit an invalid value.

8. **Admin organization plans route.** The admin portal's Hospital Plans screen reads `/admin/organizations/{organizationId}/plans`, but this route is absent from the supplied Admin endpoint summary. Please confirm the route, permission, pagination, and response DTO, or identify the supported alternative.

9. **Recruiter candidate identifiers.** Recruiter screens receive masked/public candidate IDs, while the secure resume route is described as candidate and resume UUIDs. Please specify whether `/recruiter/candidates/{candidateId}` accepts a public ID or UUID and which DTO field contains the UUID required by the resume download route.
10. **Recruiter candidate search and profile response.** Search results currently expose an internal-looking UUID and incomplete summary values; the detail route does not render a candidate object for that ID. Please return the documented search summary fields and confirm the shared identifier/detail response contract with sanitized examples.
11. **Recruiter job applicant response.** Keep candidate identifiers for backend actions, but supply masked initials and professional summary fields so the UI can identify applicants without rendering UUIDs as names. Confirm the profile route's accepted candidate ID.
12. **Recruiter plans catalog.** The Plans & Credits page shows no purchasable plans. Please confirm whether the backend intentionally returns an empty plan catalog for this account; if not, activate plans and return `{ plans, currentPlan }`, with plan `id`, `name`, `price`, `currency`, and `credits`.

13. **Canonical response and error envelope.** The supplement documents a common error shape using `error.details`, while other references and current service examples use `error.fields`. Please confirm one field-error location, whether `requestId` is always present, and the canonical paginated-list shape. Frontends now accept both documented field-error variants, but new screens need a stable contract.

14. **Staging acceptance setup.** Provide staging base URLs, CORS origins, test identities for candidate/recruiter/admin levels, and fixture records covering verified and pending organizations, pending/approved/rejected resumes, job moderation states, applications, and payments. Provider-dependent payment and file flows cannot be validated from static examples.

## Resolved by frontend changes

- Shared refresh reads tokens from the documented nested `data` response; auth DTOs are normalized from either root or `data`.
- Candidate profile step payloads, years-of-experience values, employment enums, final preference save, and onboarding completion now follow the verified contracts.
- Candidate job/contact paths use `/jobs` and `/support/contact`; candidate resume downloads use the authenticated download route.
- Recruiter organization upload uses `documentType`, the documented file types and 10 MiB limit; job/application writes use supported fields and action routes.
- Admin auth methods, role permission names, staff status updates, and permission override requests follow the verified request shapes.
