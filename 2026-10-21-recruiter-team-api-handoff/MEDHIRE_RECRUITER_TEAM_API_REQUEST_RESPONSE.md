# MedHire recruiter team, invitations, and seats API handoff

**Date:** 21 October 2026  
**Audience:** MedHire backend team  
**Purpose:** define the API behavior needed by the recruiter Team & Access page so it can show active members, pending invitations, seat usage, and available seats accurately.

## 1. Current frontend integration

The frontend API base defaults to `/api` (overridable with `VITE_API_BASE_URL`). The Team page currently calls:

| Operation | HTTP request |
| --- | --- |
| Load team and seat summary | `GET /api/recruiter/team` |
| Invite a teammate | `POST /api/recruiter/team/invitations` |
| Remove a member | `DELETE /api/recruiter/team/{userId}` |
| Preview an invitation | `GET /api/auth/invitations/{token}` |
| Accept an invitation | `POST /api/auth/accept-invite` |

Authenticated recruiter requests send `Authorization: Bearer <access-token>` and `Accept: application/json`. JSON requests also send `Content-Type: application/json`. Invitation preview and acceptance are public token-based operations; the opaque invitation token is their authorization.

## 2. Required behavior

1. A successful invite is persisted for the recruiter’s organization and an invitation email is sent.
2. The invitation appears in `pendingInvitations` immediately after creation and on every later `GET /api/recruiter/team` until it is accepted, revoked, or expires.
3. Pending invitations are not active members and must not be included in the membership `items` array. This prevents the UI from double-counting them.
4. Accepting an invitation consumes it once, creates an active recruiter membership in the inviting organization, and makes the invitation disappear from `pendingInvitations`.
5. Removing a member revokes that member’s organization access and removes them from active membership results.
6. The server enforces the seat limit even if a client submits a request while its displayed seat count is stale.

## 3. `GET /api/recruiter/team`

### Request

```http
GET /api/recruiter/team
Authorization: Bearer <recruiter-access-token>
Accept: application/json
```

The current frontend does not send pagination parameters and does not fetch additional pages. Return all organization members and pending invitations for the normal team size, or coordinate a frontend pagination change before imposing a page limit.

### Required success response

Return the existing success envelope, with membership rows, invitations, seats, and pagination metadata grouped under `data`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "usr_7f92c64a",
        "fullName": "Raju Kumar",
        "email": "raju@example.com",
        "designation": "Recruiter",
        "role": "OWNER",
        "status": "ACTIVE",
        "joinedAt": "2026-09-15T09:30:00Z"
      }
    ],
    "pendingInvitations": [
      {
        "invitationId": "inv_4d9a2b31",
        "fullName": "Jordan Lee",
        "email": "jordan@example.com",
        "role": "RECRUITER",
        "status": "INVITED",
        "createdAt": "2026-10-21T08:00:00Z",
        "expiresAt": "2026-10-28T08:00:00Z"
      }
    ],
    "seats": {
      "used": 2,
      "total": 5,
      "available": 3,
      "pendingInvitationsReserveSeats": true
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 100,
    "total": 1,
    "totalPages": 1
  }
}
```

When there are no invitations, return `"pendingInvitations": []`. When there are no members, return `"items": []`. Do not omit either array to mean empty. Return the same `seats` object on every successful response, including organizations with a real zero-seat limit.

### Field rules

| Field | Required meaning |
| --- | --- |
| `data.items` | Active organization memberships only. Include the owner in this list and count the owner as an active seat if the subscription model consumes a seat for the owner. Do not include removed users or pending invitations. |
| `items[].userId` | Stable user identifier accepted by the remove-member route. |
| `items[].status` | Canonical active membership status: `ACTIVE`. |
| `data.pendingInvitations` | Persisted, unexpired invitations that have not been accepted or revoked. |
| `pendingInvitations[].invitationId` | Stable invitation identifier. |
| `pendingInvitations[].status` | Use `INVITED` for an outstanding invitation. `PENDING` is accepted by the frontend as an alias, but `INVITED` is preferred. |
| `pendingInvitations[].createdAt`, `expiresAt` | ISO 8601 timestamps in UTC. |
| `data.seats.used` | Active seats plus outstanding invitations when invitations reserve seats. Apply the same rule consistently to every endpoint. |
| `data.seats.total` | Integer seat limit supplied by the organization’s active plan/entitlement. Return `0` if the actual limit is zero; omit only if the limit is genuinely not configured. |
| `data.seats.available` | `max(0, total - used)` when pending invites reserve seats. |
| `pendingInvitationsReserveSeats` | Boolean stating the chosen reservation rule. The recommended value is `true`. |

Never return invitation tokens in this endpoint. Do not return revoked, expired, or accepted invitations in `pendingInvitations`.

### Seat-count example

For one owner, one active teammate, and one pending invitation with a five-seat limit:

```text
used      = 1 owner + 1 active teammate + 1 reserved pending invitation = 3
total     = 5
available = 5 - 3 = 2
```

After that invite is accepted, `pendingInvitations` decreases by one and `items` gains the new active member. If pending invites reserve seats, `used` and `available` stay unchanged during acceptance. Removing an active member decreases `used` by one and increases `available` by one.

## 4. `POST /api/recruiter/team/invitations`

### Request

```http
POST /api/recruiter/team/invitations
Authorization: Bearer <recruiter-access-token>
Accept: application/json
Content-Type: application/json
```

```json
{
  "fullName": "Jordan Lee",
  "email": "jordan@example.com"
}
```

`fullName` is optional. `email` is required and should be trimmed and normalized case-insensitively. The frontend does not send a role; create the invite with the default organization teammate role (`RECRUITER`). The authenticated recruiter determines the organization. Do not accept an organization ID from the body as authority.

### Successful response

Return `201 Created` with the persisted invitation record. The frontend can read a response nested under `data`.

```json
{
  "success": true,
  "data": {
    "invitation": {
      "invitationId": "inv_4d9a2b31",
      "fullName": "Jordan Lee",
      "email": "jordan@example.com",
      "role": "RECRUITER",
      "status": "INVITED",
      "createdAt": "2026-10-21T08:00:00Z",
      "expiresAt": "2026-10-28T08:00:00Z"
    }
  }
}
```

The same invitation must be present in the next `GET /api/recruiter/team` response. Send an email containing a clickable URL in this frontend format:

```text
https://<frontend-host>/accept-invitation?token=<url-encoded-one-time-token>
```

The frontend’s route is `/accept-invitation`. Do not put the token in the team list or any later team response. Store only a hash of the token server-side if feasible; make the token unpredictable, single-use, and time-limited.

### Duplicate invite behavior

Please use these consistent outcomes:

- Existing active member with this email: `409 Conflict`, code `TEAM_MEMBER_ALREADY_ACTIVE`.
- Existing unexpired invitation: resend the existing invitation or return it unchanged; do not create multiple live invitations for the same organization/email. Return the existing invitation record with `200 OK` if resent, or `409 Conflict` with code `INVITATION_ALREADY_PENDING` if not resent.
- No available seats: `409 Conflict`, code `SEAT_LIMIT_REACHED`.
- Invalid email/body: `422 Unprocessable Content`, code `VALIDATION_ERROR` and field details.

The backend should choose one documented duplicate-invite behavior and keep it stable.

## 5. Invitation preview: `GET /api/auth/invitations/{token}`

The frontend calls this route before showing the accept form.

### Request

```http
GET /api/auth/invitations/<one-time-token>
Accept: application/json
```

### Successful response

```json
{
  "success": true,
  "data": {
    "invitation": {
      "invitationId": "inv_4d9a2b31",
      "email": "jordan@example.com",
      "fullName": "Jordan Lee",
      "organizationName": "Northside Medical Center",
      "role": "RECRUITER",
      "status": "INVITED",
      "expiresAt": "2026-10-28T08:00:00Z"
    }
  }
}
```

The frontend uses `invitation` (or the returned object itself), and reads `email`, `fullName`, `organizationName`, `status`, and `expiresAt`. Do not return secrets or internal organization data. For invalid, expired, revoked, or already-used tokens return `404` or `410` with a stable error code and safe user-facing message.

## 6. Accept invitation: `POST /api/auth/accept-invite`

The invitee sets a password on the acceptance page. The request is token-authorized and does not use an existing access token.

### Request

```http
POST /api/auth/accept-invite
Accept: application/json
Content-Type: application/json
```

```json
{
  "token": "<one-time-token-from-email-link>",
  "password": "Example!Password123",
  "fullName": "Jordan Lee"
}
```

`fullName` is optional. The frontend enforces an 8–72 character password with an uppercase letter, number, and symbol; the backend must validate its own password policy too.

### Successful response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "userId": "usr_81c4a20d",
    "email": "jordan@example.com",
    "fullName": "Jordan Lee",
    "role": "RECRUITER",
    "organizationId": "org_5a43d190",
    "membershipStatus": "ACTIVE"
  }
}
```

The frontend then directs the invitee to recruiter login. On success, atomically mark the invitation accepted/consumed, create the active organization membership, and update the team/seat response. A second attempt with the same token must fail safely and must not create another account or membership.

## 7. Remove a member: `DELETE /api/recruiter/team/{userId}`

### Request

```http
DELETE /api/recruiter/team/usr_81c4a20d
Authorization: Bearer <recruiter-access-token>
Accept: application/json
```

The path parameter is the `userId` returned in `data.items`. The frontend expects `204 No Content` or another successful 2xx response.

### Result

Remove or deactivate only the membership in the authenticated organization; do not delete the user’s global account. Revoke the removed member’s organization access and relevant sessions/tokens. The next `GET /api/recruiter/team` must omit that membership from `items` and recalculate seats. Prevent removal of the organization owner or last owner unless a separate ownership-transfer process exists. Return `404` for an unknown/non-member user and `403` when the caller lacks permission.

If the product needs invitation cancellation, add a separate route such as `DELETE /api/recruiter/team/invitations/{invitationId}` and wire it to a UI action. The current frontend does not call an invitation-cancellation route.

## 8. Error response envelope

Use one consistent JSON error shape. The frontend currently understands `error.message`, `error.code`, `error.fields`, and `error.details.fields`.

```json
{
  "success": false,
  "error": {
    "code": "SEAT_LIMIT_REACHED",
    "message": "Your organization has no available seats.",
    "fields": {},
    "requestId": "req_2cb9e1d4"
  }
}
```

For validation errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "email": ["Enter a valid email address."]
    },
    "requestId": "req_2cb9e1d4"
  }
}
```

Recommended statuses: `400` malformed request, `401` missing/invalid recruiter session, `403` insufficient role, `404` missing team member/invitation, `409` duplicate or seat-limit conflict, `410` expired/consumed invitation, `422` field validation, and `429` rate limit. Include `requestId` to help correlate support reports.

## 9. Authorization, tenancy, and security requirements

- Derive the organization from the authenticated recruiter’s membership. Never trust an organization ID supplied by the browser.
- Only an organization owner or explicitly authorized team manager may invite or remove members.
- Prevent users from reading, inviting, accepting into, or removing members from a different organization.
- Normalize email addresses consistently and enforce one active membership/invitation per organization/email.
- Rate-limit invitation creation and token-preview/acceptance requests.
- Do not expose invitation tokens from authenticated list endpoints or logs.
- Make acceptance atomic and single-use. Expired, revoked, accepted, or malformed tokens must not grant access.
- Enforce seat availability transactionally during invitation creation to prevent concurrent overbooking.
- Return only fields needed by this Team page; do not return password, token hashes, or private user attributes.

## 10. Acceptance checklist for staging

1. `GET /api/recruiter/team` returns active members, `pendingInvitations: []` when empty, and numeric seat values.
2. A successful invite returns an invitation record, sends an email with a working `/accept-invitation?token=...` URL, and appears in the next team GET.
3. Refreshing the Team page retains the pending row and count from the backend, including in a second browser session for the same organization.
4. The invitee can preview and accept once; the accepted invite leaves `pendingInvitations` and appears as `ACTIVE` in `items`.
5. Seat values follow the agreed reservation rule before invite, while pending, after acceptance, and after member removal.
6. Repeated invites, full-seat invites, expired tokens, reused tokens, unauthorized users, and cross-organization IDs return the documented errors.
7. Removing a member prevents further organization access and the removed member no longer appears in `items`.

## 11. Backend decisions requested

Please reply with the confirmed deployed response shape and these decisions:

1. Do pending invitations reserve seats? Recommended: yes; count them in `seats.used` until accepted, revoked, or expired.
2. Does the owner consume a seat? Apply one rule to `seats.used`, `seats.total`, and plan entitlement.
3. For an existing pending invite, should the POST resend it (`200`) or return `409`?
4. What is the invitation expiry period and how is resend handled?
5. Which roles may invite/remove team members, and can any role remove the owner?
6. Confirm the exact public invitation preview and acceptance routes, payloads, and email URL format.
7. Confirm whether delete returns `204` or a JSON body, and how sessions are revoked.
8. Provide staging base URL, a test organization with a known seat limit, and test recruiter accounts for owner/member roles.

**Important:** the frontend can temporarily retain a newly sent invitation in the current browser session, but the backend `GET /api/recruiter/team` response is the source of truth. Returning `pendingInvitations` and `seats` is required for accurate status across refreshes, devices, and team members.
