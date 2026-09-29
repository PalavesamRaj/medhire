# MedHire Recruiter API Handoff

**Status: proposed contract for backend review.** For the complete recruiter journey in one document, use the [Recruiter Backend API and Flow Handoff](medhire-recruiter-backend-handoff.html) (PDF: `medhire-recruiter-backend-handoff.pdf`). This file retains the detailed recruiter workspace API reference. Its resource paths and response shapes are not confirmed against a running backend. The focused recruiter login flow is in [Recruiter Login Flow Handoff](medhire-recruiter-login-flow-handoff.html); shared authentication routes are in `medhire-auth-backend-handoff.html`.

## Base URL and authentication

Set `VITE_API_BASE_URL` to the API base, for example `https://api.example.com/api`. The paths below are relative to that base, so the dashboard path becomes `/api/recruiter/dashboard`.

All recruiter resource routes require:

```http
Authorization: Bearer <accessToken>
Accept: application/json
Content-Type: application/json
```

The backend must identify the recruiter and organization from the token. It must enforce organization approval and permissions server side; frontend route guards are not an authorization boundary. Return `403 ORGANIZATION_NOT_APPROVED` for a pending/rejected organization where recruiter data access is blocked.

Use ISO 8601 UTC timestamps. Candidate and transaction IDs are opaque strings. Amounts are decimal strings with a separate ISO 4217 currency code; do not use binary floating point for server-side calculations.

## Common list format

List endpoints use this envelope (including empty results):

```json
{
  "items": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

Defaults: `page=1`, `pageSize=20`; cap `pageSize` at 100. Validate and clamp pagination values.

## Endpoints

### Recruiter dashboard

`GET /recruiter/dashboard`

Returns recruiter-facing account metrics, recent activity and a small recommended-candidate list.

```json
{
  "metrics": {
    "candidateSearches": 284,
    "profilesUnlocked": 47,
    "shortlistedCandidates": 23,
    "availableCredits": 156
  },
  "organization": {
    "name": "City General Hospital",
    "location": "New York, NY",
    "verificationStatus": "approved"
  },
  "recentActivity": [
    { "id": "act_01", "description": "Candidate profile unlocked", "occurredAt": "2026-09-24T09:00:00Z" }
  ],
  "recommendedCandidates": []
}
```

Candidate summaries use the search-result shape below. Only return candidates the recruiter is allowed to discover; keep private identity/contact fields masked until an unlock is confirmed.

### Search candidates

`GET /recruiter/candidates`

Query parameters: `query`, `specialty`, `location`, `minExperience`, `maxExperience`, `licenseState`, `employment`, `availability`, `page`, `pageSize`.

Returns the common list envelope. Each item:

```json
{
  "id": "MH-10482",
  "initials": "MH",
  "title": "Registered Nurse",
  "specialty": "Critical Care",
  "experience": "5 Years Experience",
  "experienceYears": 5,
  "location": "Chicago, IL",
  "education": "BSN",
  "license": "Active License - IL",
  "availability": "Immediate",
  "employment": "Full-time",
  "tags": ["ICU", "BLS", "ACLS"],
  "unlocked": false
}
```

Do not include full name, personal email, phone, address, resume URL, or other masked profile details in search results.

### Candidate profile

`GET /recruiter/candidates/{candidateId}`

Returns the masked profile unless it was previously unlocked:

```json
{
  "candidate": {},
  "profile": {
    "summary": "...",
    "workExperience": [],
    "skills": [],
    "career": [],
    "contact": { "fullName": null, "email": null, "phone": null, "address": null }
  },
  "access": { "unlocked": false, "unlockCost": 5 },
  "creditBalance": { "available": 156 }
}
```

For locked candidates, keep contact values masked/null. An unlocked profile may return the fields the recruiter purchased access to.

### Unlock candidate

`POST /recruiter/candidates/{candidateId}/unlock`

Request body: `{}`. The backend must atomically verify organization approval and sufficient credits, debit credits once, record the purchase, and grant access. Make retries safe/idempotent (support an `Idempotency-Key` request header).

```json
{
  "candidateId": "MH-10482",
  "unlocked": true,
  "creditsUsed": 5,
  "creditBalance": { "available": 151 },
  "profile": {}
}
```

Return `409 INSUFFICIENT_CREDITS` if the balance is too low. Do not debit if the transaction fails.

### Purchased candidates

`GET /recruiter/purchased-candidates`

Query parameters: `query`, `specialty`, `location`, `status`, `page`, `pageSize`. Returns the common list envelope. Each item contains `id`, `initials`, `name`, `title`, `specialty`, `experience`, `location`, `unlockedDate`, and `status` (`Active` or `Contacted`). These are only candidates this organization has unlocked.

### Shortlisted candidates

`GET /recruiter/shortlisted-candidates`

Query parameters: `query`, `specialty`, `unlockStatus`, `location`, `page`, `pageSize`. Returns the common list envelope. Each item contains `id`, `initials`, `name` (masked if locked), `title`, `specialty`, `experience`, `location`, `status` (`Unlocked` or `Locked`), and `date` (ISO 8601).

`POST /recruiter/shortlisted-candidates`

```json
{ "candidateId": "MH-10482" }
```

Returns `{ "candidateId": "MH-10482", "shortlisted": true }` with `201 Created` (or `200 OK` if already shortlisted).

`DELETE /recruiter/shortlisted-candidates/{candidateId}`

Returns `204 No Content`. Deleting a shortlist entry must not delete a candidate or unlock purchase.

### Plans and credits

`GET /recruiter/plans` returns `{ "plans": [], "currentPlan": { ... } }`. Plan fields: `id`, `name`, `price`, `currency`, `billingInterval`, `credits`, `jobPosts`, `recruiterSeats`, `validityDays`, and `features`. The backend is authoritative for plan prices and entitlements; the frontend must not charge using hard-coded prices.

`GET /recruiter/credits` returns:

```json
{ "available": 156, "used": 94, "currency": "USD" }
```

### Start plan checkout

`POST /recruiter/checkout`

The browser must not send raw card number, expiry, or CVV to this endpoint. Use a PCI-compliant hosted checkout or provider tokenization. The request starts a checkout session:

```json
{
  "planId": "professional",
  "successUrl": "https://app.example.com/recruiter/payment-success",
  "cancelUrl": "https://app.example.com/recruiter/payment-failed"
}
```

Return `201 Created`:

```json
{
  "checkoutSessionId": "cs_123",
  "checkoutUrl": "https://payment-provider.example/session/cs_123"
}
```

Only a verified provider webhook may mark a transaction successful and add credits. A browser redirect alone must never grant credits. Provider cancellation/failure should leave the balance unchanged.

`GET /recruiter/checkout/{checkoutSessionId}`

Returns the authenticated organization's server-verified checkout status for the return page. Example: `{ "checkoutSessionId": "cs_123", "status": "pending", "transactionId": null, "message": null }`. Use `successful`, `failed`, `cancelled`, or `pending` status values. A success return URL is not proof of payment; update this resource only from a verified provider webhook. Scope session IDs to the owning organization.

### Payment history

`GET /recruiter/payment-history`

Query parameters: `status` (`Successful`, `Failed`, `Pending`), `startDate`, `endDate`, `page`, `pageSize`. Returns the common list envelope; each item:

```json
{
  "id": "TXN-2026-09187",
  "date": "2026-09-18T00:00:00Z",
  "plan": "Professional",
  "credits": 50,
  "amount": "268.92",
  "currency": "USD",
  "method": "Visa ending in 4242",
  "status": "Successful",
  "invoiceAvailable": true
}
```

`GET /recruiter/payment-history/{transactionId}/invoice` returns invoice details only when the transaction belongs to the authenticated organization and is invoice-eligible. Suggested payload: `{ "invoice": { "invoiceNumber", "date", "billedTo", "billedFrom", "lineItems", "subtotal", "tax", "total", "currency", "transactionId", "paymentMethod", "status" } }`. For PDF delivery, return an authorized short-lived download URL or stream the PDF; do not expose public invoice URLs.

### Hospital profile

`GET /recruiter/hospital-profile` returns `{ "profile": { ... }, "verification": { ... }, "hiringPreferences": { ... } }`. Profile fields correspond to the hospital and recruiter contact fields shown in the UI (organization name/type/registration, website, contacts, address, recruiter name/designation, and business email). Verification fields are read-only and controlled by MedHire.

`PATCH /recruiter/hospital-profile` accepts `{ "profile": { ...editableOrganizationAndContactFields }, "hiringPreferences": { "specialties": [], "locations": [], "employmentTypes": [] } }`. Reject attempts to change verification status, registration approval, or organization ownership. Return the updated profile envelope. Use `422 VALIDATION_ERROR` with field errors for invalid values.

## Error response and status codes

Use the same error envelope as auth:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "specialty": "Unknown specialty." }
  }
}
```

Expected statuses: `400` malformed request, `401` missing/expired session, `403` wrong role or organization not approved, `404` resource not found/not visible to this organization, `409` insufficient credits or conflicting state, `422` validation/business-rule failure, `429` rate limited, `500` unexpected server error. Never return another organization's candidates, transactions, invoices, or profile data.

## Frontend integration state

`src/lib/recruiterApi.js` implements the proposed resource paths and request/error handling. Recruiter workspace screens now request their data through this client and show loading, empty, and error states; no recruiter example records are bundled as a fallback. These screens require the backend routes above to be implemented and confirmed. Checkout redirects to a hosted provider session, and the return page queries the server-verified session status. Payment history and invoices require their backend resources; no client-only payment can grant credits.
