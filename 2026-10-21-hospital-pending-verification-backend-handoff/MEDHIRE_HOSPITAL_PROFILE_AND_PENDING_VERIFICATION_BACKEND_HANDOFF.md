# MedHire hospital profile and pending verification API handoff

**Date:** 21 October 2026  
**Audience:** MedHire backend team  
**Purpose:** Confirm and complete the recruiter organization profile and verification document API contract. This handoff covers the pending verification workflow and the approved organization Hospital Profile page, where recruiters need to view documents previously submitted for review.

## 1. What the frontend needs

The recruiter needs to:

1. Register with recruiter and organization details.
2. Sign in while the organization is still `PENDING`.
3. See the persisted organization/recruiter values and verification status on the pending page.
4. Upload and list organization verification documents before approval.
5. Have an admin review those documents and approve or reject the organization.
6. See the submitted documents and their review status later on Hospital Profile after approval.
7. If rejected, correct the permitted organization details, submit a reviewer note, and resubmit.

The pending page redirects an approved recruiter to the dashboard. Hospital Profile is therefore the persistent place for approved recruiters to view submitted documents. It uses the recruiter organization documents list endpoint in read-only mode.

## 2. Current issue observed

The pending verification page showed:

> This account is not linked to an active organization membership. Document upload is available before approval, but requires an active OWNER or ADMIN membership.

This points to an authorization/membership problem. It is not evidence of a bad multipart field. The frontend sends the documented multipart names `documentType` and `document`.

The screenshots did not capture the HTTP status, canonical API error code, response body, or request ID. Backend team: please inspect the affected recruiter, organization, and membership records and return a sanitized trace with those details.

## 3. Recruiter registration request

### Endpoint

`POST /api/auth/register`

### Frontend request fields

The recruiter registration page sends the following JSON fields. `phone` is normalized to include the `+91` country prefix; email is lowercased. Password is sent only to the registration API and must never be returned by any API.

```json
{
  "role": "recruiter",
  "fullName": "<recruiter-name>",
  "email": "<work-email>",
  "phone": "+91<phone-number>",
  "designation": "<designation>",
  "organizationName": "<hospital-or-organization-name>",
  "organizationWebsite": "<website-or-empty-string>",
  "city": "<city>",
  "state": "<state>",
  "password": "<redacted-password>",
  "termsAccepted": true
}
```

The signup form does **not** collect registration number, street address, postal code, country, organization type, license, accreditation, or verification date. Those values must come from a later organization/profile flow or MedHire administration; the frontend cannot derive them from signup.

### Required registration and login behavior

- Create the recruiter and organization, then create the registering recruiter’s active organization membership as `OWNER` (or another explicitly authorized document manager role).
- The organization remains `PENDING` until MedHire finishes review. Do not require approval to submit verification documents.
- Return the persistent organization/recruiter fields in the registration/login/current-user response where the existing auth contract permits. At minimum, the login/current-user `user` needs stable recruiter identity and organization ID/name/status. The full organization profile should be returned by the Hospital Profile GET endpoint below.
- State the exact membership role and status values used by document list/upload/delete authorization.
- Repair existing accounts created without an active owner membership, or provide the supported repair procedure.

## 4. Hospital Profile read

### Endpoint

`GET /api/recruiter/hospital-profile`

### Request

```http
Accept: application/json
Authorization: Bearer <access-token>
```

No query parameters or request body. Resolve the organization from the authenticated recruiter’s active membership; do not accept a client-supplied `organizationId` as access scope.

### Data required by the page

Return the authenticated organization’s persisted values. The frontend supports flat and nested response envelopes, but the backend should document and use one canonical shape. The fields below describe the page’s needs; fields absent from the database may be `null` and should be documented as such.

| Group | Fields needed | Notes |
|---|---|---|
| Organization | `hospitalName`, `organizationType`, `registrationNumber`, `website`, `hospitalPhone`, `address`, `city`, `state`, `postal`, `country` | Name, website, city and state originate in signup. Other values are not on the signup form. |
| Recruiter contact | `recruiterName`, `designation`, `contactEmail` / `businessEmail`, `recruiterPhone` | Name, designation, email and phone originate in signup. Confirm whether these are organization contact values or recruiter-user values. |
| Verification | `status`, `verifiedAt`, `licenseStatus` / organization license metadata, `accreditation` | Read-only and controlled by MedHire. Return actual values; do not infer approval date from status. |
| Hiring preferences | `specialties`, `locations`, `employmentTypes` | Arrays. Empty arrays mean no preference has been saved. |

### Recommended success response (proposed schema, not a captured server response)

```json
{
  "success": true,
  "data": {
    "profile": {
      "organizationId": "<organization-id>",
      "hospitalName": "<organization-name>",
      "organizationType": null,
      "registrationNumber": null,
      "website": "<website>",
      "contactEmail": "<recruiter-work-email>",
      "hospitalPhone": "+91<phone-number>",
      "recruiterName": "<recruiter-name>",
      "designation": "<designation>",
      "address": null,
      "city": "<city>",
      "state": "<state>",
      "postal": null,
      "country": null
    },
    "verification": {
      "status": "PENDING",
      "verifiedAt": null,
      "licenseStatus": null,
      "accreditation": null
    },
    "hiringPreferences": {
      "specialties": [],
      "locations": [],
      "employmentTypes": []
    }
  }
}
```

The local recruiter API comparison also records a backend example with flat `name`, `phone`, `postalCode`, `status`, and `verificationStatus` fields alongside `profile` and `hiringPreferences`. Please confirm whether that is the actual response. If it is, provide its complete sanitized body and stable field mapping to the recommended shape above. Do not return an empty profile envelope with HTTP 200 when organization data exists.

## 5. Hospital Profile update

### Endpoint

`PATCH /api/recruiter/hospital-profile`

### Request

```http
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json
```

The frontend request shape is:

```json
{
  "profile": {
    "hospitalName": "<organization-name>",
    "registrationNumber": "<registration-number>",
    "website": "https://<organization-website>",
    "hospitalPhone": "+91<phone-number>",
    "address": "<street-address>",
    "city": "<city>",
    "state": "<state>",
    "postal": "<postal-code>",
    "country": "<country>"
  },
  "hiringPreferences": {
    "specialties": ["<specialty>"],
    "locations": ["<city-or-region>"],
    "employmentTypes": ["FULL_TIME"]
  }
}
```

`hiringPreferences` arrays may be empty. The frontend currently edits organization information and all three preference arrays. Organization type, verification fields, and recruiter identity/contact fields are displayed read-only; they are not sent in this PATCH contract. Do not accept a client-supplied verification status, approval decision, owner, or organization ID.

### Backend must confirm

- Exact editable fields, required/optional/null behavior, maximum lengths, URL/phone/address validation, and supported employment type enum values.
- Whether an approved organization may update legal/name/registration fields and whether such changes trigger re-review. If a field/state is prohibited, return explicit `403`/`409` or field-level `422`; do not silently discard accepted-looking values.
- Whether omitted fields are unchanged and whether `null` clears a field.
- Success status and complete success body. The frontend performs a fresh GET after PATCH and treats that GET as authoritative.

### Recommended success response

Return the same canonical `{ success, data: { profile, verification, hiringPreferences } }` envelope as GET, with saved values reflected. Example below is illustrative only:

```json
{
  "success": true,
  "data": {
    "profile": {
      "organizationId": "<organization-id>",
      "hospitalName": "<saved-name>",
      "registrationNumber": "<saved-registration-number>",
      "website": "https://<saved-website>",
      "hospitalPhone": "<saved-phone>",
      "address": "<saved-address>",
      "city": "<saved-city>",
      "state": "<saved-state>",
      "postal": "<saved-postal>",
      "country": "<saved-country>"
    },
    "verification": { "status": "PENDING", "verifiedAt": null },
    "hiringPreferences": {
      "specialties": ["<specialty>"],
      "locations": ["<city-or-region>"],
      "employmentTypes": ["FULL_TIME"]
    }
  }
}
```

## 6. Verification document list (pending and approved pages)

### Endpoint

`GET /api/recruiter/organization/documents`

### Request

```http
Accept: application/json
Authorization: Bearer <access-token>
```

No query parameters or body. Scope the list to the authenticated recruiter’s organization. The endpoint must be readable by an authorized active organization member both before and after approval so an approved recruiter can see previously submitted files on Hospital Profile. This is a read requirement; the pending/rejected-only upload rule does not imply that document history should disappear after approval.

### Recommended success response (proposed schema, not captured)

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "<document-id>",
        "organizationId": "<organization-id>",
        "documentType": "TAX_ID",
        "fileName": "tax-document.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 245760,
        "reviewStatus": "PENDING",
        "uploadedAt": "2026-10-21T10:30:00.000Z",
        "reviewedAt": null,
        "rejectionReason": null
      }
    ]
  }
}
```

Return a stable `documentId`, `documentType`, `fileName`, `reviewStatus`, and `uploadedAt` for every item. `reviewStatus`, `reviewedAt`, and `rejectionReason` must represent actual admin review data. For zero documents, return `documents: []` with HTTP 200. Do not return public object-storage URLs. Confirm whether recruiter preview/download is supported; if so, use an authenticated endpoint or short-lived signed URL.

## 7. Verification document upload

### Endpoint

`POST /api/recruiter/organization/documents`

### Eligibility

- Recruiter is authenticated and email-verified/active as required by the auth contract.
- Recruiter has an active organization membership with document-management permission (`OWNER` or `ADMIN` per the current source-backed docs).
- Organization state is `PENDING` or `REJECTED`. Approval must not be a prerequisite to submit the files needed for approval.
- The frontend must not send `organizationId`; scope by authenticated membership.

### Request

```http
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: multipart/form-data; boundary=<generated-by-client>
```

Multipart fields:

| Field | Type | Required | Values / constraints |
|---|---|---:|---|
| `documentType` | text | Yes | `REGISTRATION_CERTIFICATE`, `BUSINESS_LICENSE`, `TAX_ID`, `ACCREDITATION`, `OTHER` |
| `document` | file | Yes | PDF, JPEG, or PNG; validate file signature; maximum 10 MiB |

Do not require the frontend to set a bare multipart `Content-Type`; the HTTP client must add the boundary.

```bash
curl -X POST "${BASE_URL}/api/recruiter/organization/documents" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "documentType=TAX_ID" \
  -F "document=@./tax-document.pdf;type=application/pdf"
```

### Success

The existing source-backed reference confirms HTTP `201 Created` and says the response includes a document ID, organization/document metadata, and review state. Exact property names and envelope still need a sanitized live example. The proposed list/upload document schema in this handoff is a target for confirmation, not a claimed captured response.

## 8. Replace and delete document behavior

The recruiter UI offers **Replace** and **Remove**. The frontend implements replacement by uploading the new file first, then deleting the previous document by ID. This protects the old file if the new upload fails.

### Delete endpoint

`DELETE /api/recruiter/organization/documents/{documentId}`

Request uses Bearer auth and no body. Confirm:

- Whether active `OWNER`/`ADMIN` membership is required.
- Whether deletion is permitted for `PENDING`, `REJECTED`, and `APPROVED` organizations and for already-reviewed documents.
- Whether HTTP `204` or a JSON success envelope is returned.
- Whether a document that is already under admin review can be deleted, and whether replacing a document should mark the prior record `SUPERSEDED` instead of hard-deleting it for audit history.

The approved Hospital Profile page is read-only and does not expose delete/replace controls. If approved organizations should be able to amend verification evidence, define a re-review flow and server authorization contract first.

## 9. Rejected organization resubmission

### Endpoint

`POST /api/recruiter/organization/resubmit`

### Frontend request

```http
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{ "message": "<reviewer-note-about-corrections>" }
```

Confirm whether `message` is required, its maximum length, and which organization states may call this endpoint. On success, the organization should return to `PENDING` and the response should include the updated status and any persisted reviewer note/decision history that the UI needs. A proposed body is:

```json
{
  "success": true,
  "data": {
    "organizationStatus": "PENDING",
    "resubmittedAt": "2026-10-21T11:00:00.000Z"
  }
}
```

This is a proposed shape only; provide the actual sanitized response.

## 10. Current-user verification state and routing

The pending page calls `GET /api/auth/me` on load, when the browser regains focus, and every 30 seconds. The frontend expects a response containing `user` at the root or under `data.user`. For recruiter routing, provide a canonical organization state such as `organizationVerificationStatus` or `organizationStatus` with values including `PENDING`, `REJECTED`, and `APPROVED`/`VERIFIED`, plus `rejectionReason` when rejected.

When status becomes approved, the pending page navigates to the recruiter workspace. Hospital Profile should continue to return verification status and document history so the recruiter can inspect the submitted evidence there.

## 11. Error contract requested

Use a consistent JSON error envelope and include a request/correlation ID. The current UI can display a message, but the backend team should return canonical status, code, message, structured field/details, and `requestId`.

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_MEMBERSHIP_REQUIRED",
    "message": "An active organization owner or admin membership is required.",
    "details": { "requiredRoles": ["OWNER", "ADMIN"] }
  },
  "requestId": "<request-id>"
}
```

The code above is illustrative. Please provide the actual error status and body for the screenshot’s membership failure. Also define errors for invalid/missing file, unsupported MIME/signature, file too large, forbidden organization state, missing document, and validation failures. The UI should be able to distinguish authorization problems from invalid files and server failures.

## 12. Required sanitized backend examples

Please send the complete status and JSON body for each response from the running service (redact tokens, emails, names, IDs, storage keys, and private URLs):

1. `POST /api/auth/register` recruiter success and any registration user/organization fields returned.
2. `GET /api/auth/me` for a pending recruiter and for an approved recruiter.
3. `GET /api/recruiter/hospital-profile` for the affected organization.
4. `PATCH /api/recruiter/hospital-profile` success, followed by GET to prove persistence.
5. `GET /api/recruiter/organization/documents` for pending and approved organization states, including an empty-list case.
6. `POST /api/recruiter/organization/documents` success while `PENDING` and its corresponding subsequent GET list.
7. Upload denied because membership is missing/inactive, including status, error code/details, and `requestId`.
8. Upload denied for invalid file type and for file larger than 10 MiB.
9. `DELETE /api/recruiter/organization/documents/{documentId}` success and denied/not-found cases.
10. `POST /api/recruiter/organization/resubmit` success for a rejected organization.
11. Admin review success/rejection and the resulting recruiter list/profile response showing updated review status.

## 13. Backend implementation checklist

- [ ] Create an active `OWNER` membership for the registering recruiter in the registration transaction.
- [ ] Repair existing users missing that membership and report the repair process.
- [ ] Keep organization state `PENDING` until admin review; allow eligible upload in `PENDING` and `REJECTED`.
- [ ] Persist signup fields and return them consistently through login/current-user and Hospital Profile GET.
- [ ] Implement/document one stable GET and PATCH profile schema and ensure PATCH read-after-write persistence.
- [ ] Return hiring preference arrays `specialties`, `locations`, `employmentTypes` consistently.
- [ ] Return document list to authorized members after approval as well as before approval.
- [ ] Return stable document identifiers and review metadata from upload and list.
- [ ] Define deletion/replacement audit behavior and approved-state policy.
- [ ] Return canonical error status/code/details/request ID for every failure class.
- [ ] Provide the sanitized live examples listed above.

## 14. Frontend implementation notes

- Profile page: `GET /recruiter/hospital-profile`; PATCH sends `{ profile, hiringPreferences }`; the frontend re-fetches after save and renders returned values.
- Pending page: polls `/auth/me`; uploads/lists documents through `/recruiter/organization/documents`; rejected organizations can edit permitted fields and call `/recruiter/organization/resubmit`.
- Hospital Profile now renders the organization document list in read-only mode so approved recruiters have a place to see submitted files.
- The document list parser accepts common response envelopes, but the canonical backend schema still needs confirmation.
- The frontend does not fabricate missing verification dates, license states, accreditation, or document metadata. A dash means the API did not return that value.
- No live backend request was performed while preparing this handoff. The membership error and blank profile fields are based on screenshots and prior local integration notes, not a captured server trace.

## 15. References

- `2026-10-19-backend-api-mismatches/MEDHIRE_RECRUITER_FRONTEND_BACKEND_COMPARISON.md` — current local frontend/backend comparison, including hospital profile and document upload notes.
- `2026-10-19-backend-api-mismatches/MEDHIRE_RECRUITER_SANITIZED_API_TRACES.md` — observed-screen/API evidence and limits.
- `2026-10-21-recruiter-document-upload-backend-handoff/MEDHIRE_RECRUITER_ORGANIZATION_DOCUMENT_UPLOAD_HANDOFF.md` — earlier organization document upload handoff.
- Frontend: `src/lib/recruiterAuthApi.js`, `src/lib/recruiterApi.js`, `src/lib/authSession.js`, `src/pages/RegisterRecruiter.jsx`, `src/pages/Login.jsx`, `src/pages/recruiter/RecruiterHospitalProfile.jsx`, `src/pages/recruiter/RecruiterVerificationPending.jsx`, `src/components/recruiter/OrganizationDocuments.jsx`.

