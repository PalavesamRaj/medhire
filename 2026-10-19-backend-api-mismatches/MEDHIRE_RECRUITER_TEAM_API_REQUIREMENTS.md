# MedHire recruiter team API additions requested

**Purpose:** provide the recruiter Team page with pending invitation counts, invitation rows, and organization seat usage.

## Current contract gap

The documented `GET /api/recruiter/team` response contains paginated membership rows only. It does not include pending invitations or seat limits/usage. The frontend cannot derive those values from accepted members, and the invitation creation response is not a substitute for a persisted list. With the current response, the page correctly shows these metrics as unavailable.

## Requested `GET /api/recruiter/team` response

Keep the existing `data` membership array and pagination fields for compatibility, and add `pendingInvitations` and `seats` to the response. For example:

```json
{
  "success": true,
  "data": [
    {
      "userId": "[USER_UUID]",
      "fullName": "[MEMBER_NAME]",
      "email": "member@example.invalid",
      "role": "OWNER",
      "status": "ACTIVE"
    }
  ],
  "pendingInvitations": [
    {
      "invitationId": "[INVITATION_UUID]",
      "fullName": "[INVITEE_NAME]",
      "email": "invitee@example.invalid",
      "status": "INVITED",
      "createdAt": "2026-10-19T10:00:00Z",
      "expiresAt": "2026-10-26T10:00:00Z"
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

The frontend also accepts this metadata nested under `data` (alongside `items` or `members`) and common snake_case aliases. A single canonical response shape is preferred.

## Field definitions

- `pendingInvitations`: persisted, unexpired invitations for the authenticated organization that have not been accepted or revoked. Return `[]` when none exist. Include a stable invitation ID, masked or invitee email/name as allowed, status, creation time, and expiry time. Never return invitation tokens.
- `seats.used`: seats currently consumed. Define consistently whether pending invitations reserve seats; the recommended definition is active members plus pending invitations if they reserve capacity. Document this explicitly.
- `seats.total`: organization seat limit. Return an integer, including `0` when the actual limit is zero; do not omit it to mean unavailable.
- `seats.available`: remaining invite capacity. If pending invitations reserve seats, calculate as `max(0, total - used)` with the same reservation rule.
- `pagination.total`: count matching the membership `data` array query, not the invitation count. Document page and page-size behavior.

## Invitation creation

`POST /api/recruiter/team/invitations` should return the persisted invitation status and expiry, for example:

```json
{
  "success": true,
  "data": {
    "invitationId": "[INVITATION_UUID]",
    "email": "invitee@example.invalid",
    "status": "INVITED",
    "createdAt": "2026-10-19T10:00:00Z",
    "expiresAt": "2026-10-26T10:00:00Z"
  }
}
```

Please confirm whether a pending invitation consumes a seat, how duplicate invitations are handled, and whether the list includes expired/revoked invitations (recommended: exclude them from `pendingInvitations`). Provide sanitized request/response examples and the deployed response shape.
