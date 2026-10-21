# MedHire recruiter organization document upload handoff

**Date:** 21 October 2026  
**Audience:** MedHire backend team  
**Purpose:** Resolve the recruiter verification document upload blocker and confirm the full request/response contract.

## Summary

The recruiter verification page is intended to collect organization documents while the organization is still awaiting verification. The expected workflow is:

1. Recruiter registers an account and a new organization.
2. Backend links the registering recruiter to that organization as an active `OWNER` (or another authorized document manager role).
3. Recruiter verifies their email and signs in. The organization is still `PENDING`.
4. Recruiter uploads the verification documents.
5. Admin reviews the documents and then approves or rejects the organization.

The upload request in the frontend already matches the documented multipart fields. In the provided screenshot, the page displays **“Active organization membership required.”** The HTTP status, error code, and request ID were not captured, so those should be confirmed from a backend trace. The failure indicates that the registering recruiter is not recognized as an active organization member, which prevents the pre-approval upload flow from working.

## Required backend action

- During recruiter/organization registration, create the organization membership for the registering recruiter, linked to the newly created organization, with an active status and `OWNER` role (or the role authorized to manage organization documents).
- Ensure this membership is available to the upload authorization check after email verification and login, while the organization status is `PENDING`.
- Repair existing recruiter accounts that created organizations without an active membership, or document the supported administrative repair procedure.
- Keep document upload available for organizations in `PENDING` and `REJECTED` states, as specified in the source-verified API reference. Do not require the organization to be `VERIFIED` before its verification documents can be uploaded.
- Return the canonical error status, code, details, and `requestId` when membership authorization fails.

## Upload request contract

### Endpoint

`POST /api/recruiter/organization/documents`

### Authorization and eligibility

- `Authorization: Bearer <access-token>` for a signed-in recruiter.
- Recruiter account must pass the recruiter authentication checks and be linked to an active organization membership.
- Membership must be authorized to manage organization documents; the documented roles are `OWNER` and `ADMIN`.
- Organization verification state must be `PENDING` or `REJECTED`.

### Headers

```http
Accept: application/json
Authorization: Bearer <access-token>
```

Send `multipart/form-data`. The HTTP client must generate the multipart boundary. Do **not** set a bare `Content-Type: multipart/form-data` header manually.

### Multipart fields

| Field | Type | Required | Allowed values / constraints |
|---|---|---:|---|
| `documentType` | Text | Yes | `REGISTRATION_CERTIFICATE`, `BUSINESS_LICENSE`, `TAX_ID`, `ACCREDITATION`, `OTHER` |
| `document` | File | Yes | PDF, JPEG, or PNG; file signature must match the claimed type; maximum 10 MiB |

### Example

```bash
curl -X POST "${BASE_URL}/api/recruiter/organization/documents" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "documentType=REGISTRATION_CERTIFICATE" \
  -F "document=@./hospital-registration.pdf;type=application/pdf"
```

Do not add an `organizationId` form field unless the backend changes and documents the contract. The current documented endpoint scopes the operation through the authenticated recruiter's organization membership.

## Success response contract

The API reference confirms **HTTP 201 Created**. The source-verified supplement says the result includes:

- `documentId`
- organization/document metadata
- document review state

The recruiter API reference does not define the complete JSON property names, nullability, or envelope for this response. Backend team: please confirm the canonical schema and provide a sanitized response captured from the running service. The following is a **proposed example only** to make the missing contract concrete; it is not claimed to be the current server response:

```json
{
  "success": true,
  "data": {
    "documentId": "<document-id>",
    "organizationId": "<organization-id>",
    "documentType": "REGISTRATION_CERTIFICATE",
    "fileName": "hospital-registration.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245760,
    "reviewStatus": "PENDING",
    "uploadedAt": "2026-10-21T10:30:00.000Z"
  }
}
```

Please confirm or replace these proposed keys, especially the envelope, `reviewStatus` enum, and file metadata names. The frontend should consume the confirmed `documentId`, document type, filename, and review state.

### Backend team response requested

Please reply with the following **actual, sanitized responses from the running backend**. Do not use the proposed upload example above as confirmation unless it matches the implementation.

1. **Upload success:** HTTP status and complete JSON body returned by `POST /api/recruiter/organization/documents` for a successful upload. Confirm the envelope and exact field names for document ID, organization ID, document type, filename, MIME type, size, review status, and upload timestamp. State which fields may be absent or null and list the review-status values.
2. **Document list:** HTTP status and complete JSON body returned by `GET /api/recruiter/organization/documents` after that upload. Confirm the list envelope and how each item maps to the upload response.
3. **Membership rejection:** HTTP status and complete error body for the observed “Active organization membership required” case, including its error code, details, and `requestId` when available.
4. **Registration membership:** Confirm that recruiter registration creates an active `OWNER` membership for the newly created organization, and specify the role/status values used by the upload authorization check. If it does not, provide the endpoint or operational steps that activate the membership before document submission.
5. **Pending-state eligibility:** Confirm that an active `OWNER`/`ADMIN` can upload while the organization is `PENDING` or `REJECTED`, without organization approval, and provide a sanitized successful pending-state example.

These responses will let the frontend use the exact server contract and verify that documents can be submitted before admin approval.

## List response contract to confirm

The page refreshes the list after a successful upload using:

`GET /api/recruiter/organization/documents`

The API reference confirms HTTP 200 but says the complete result shape requires runtime verification. Please provide a sanitized response example and confirm whether records are returned under `data`, `data.documents`, `data.items`, or another documented property. Each list item should expose the same stable document ID and review metadata returned by upload.

## Error observed and diagnosis

The verification page displays:

> Active organization membership required.

The page shows this after attempting upload, while the organization is awaiting verification. The UI has been updated to explain that document access requires an active `OWNER`/`ADMIN` membership, and the frontend request uses the documented `documentType` and `document` multipart fields.

Please inspect the registration-created user, organization, and membership rows for this account. Confirm:

1. Whether recruiter registration creates an organization membership.
2. The membership's role and status immediately after registration.
3. Whether email verification or login is expected to activate that membership.
4. Which exact middleware/service guard returns this message and its HTTP status/error code.
5. Whether upload middleware and the service are reached after authorization.

If the membership is not created or activated at registration, create an active organization owner membership as part of the registration transaction. The organization itself should remain `PENDING`; document submission must precede admin approval.

## Related endpoints

| Operation | Endpoint | Notes |
|---|---|---|
| List recruiter organization documents | `GET /api/recruiter/organization/documents` | Authenticated recruiter; full response schema needs confirmation. |
| Upload recruiter organization document | `POST /api/recruiter/organization/documents` | Multipart request described above; documented 201 response. |
| Delete recruiter organization document | `DELETE /api/recruiter/organization/documents/{documentId}` | Organization-scoped; confirm deletion response/status if clients need to rely on it. |
| Admin download organization document | `GET /api/admin/organizations/{organizationId}/documents/{documentId}/download` | Use the documented admin authorization and private/signed download behavior. |
| Admin review organization document | `POST /api/admin/organizations/{organizationId}/documents/{documentId}/review` | Review decision is `APPROVED` or `REJECTED`; rejection requires a reason. |

## Frontend status

- Upload path: `/recruiter/organization/documents` (API base defaults to `/api`).
- Multipart fields: `documentType` and `document`.
- Supported types/categories and 10 MiB frontend file-size limit match the provided contract.
- Frontend does not send `organizationId`; ownership is expected to come from the authenticated recruiter membership.
- Upload/list result handling accepts common response envelopes, but the exact server response must still be confirmed.
- No live backend request was performed as part of this handoff; the displayed authorization message came from the user's screenshot.

## References

- `MEDHIRE_RECRUITER_API.md`, “Organization and team” and the document list/upload endpoint sections.
- `MEDHIRE_SOURCE_VERIFIED_CONTRACTS.md`, “Recruiter APIs → Organization and team”.
- `MEDHIRE_ALL_APIS.postman_collection.json`, `POST /api/recruiter/organization/documents` multipart example.
- Frontend: `src/lib/recruiterApi.js`, `src/components/recruiter/OrganizationDocuments.jsx`, `src/pages/recruiter/RecruiterVerificationPending.jsx`.
