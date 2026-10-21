# MedHire recruiter dashboard backend handoff

**Date:** 21 October 2026  
**Audience:** MedHire backend team  
**Purpose:** Confirm the recruiter dashboard API contract, define dashboard metric semantics, and resolve why Recent Activity is empty in the frontend.

## Summary

The recruiter dashboard UI is implemented and requests live data. It does not hard-code the sample values or activity entries shown in Figma. The page displays **“No recent activity”** when the dashboard endpoint returns no activity records, an empty activity list, or a response field the frontend cannot identify.

The API comparison document says `GET /api/recruiter/dashboard` has a service-defined response and does not fully specify the dashboard DTO. The frontend can map common response names, but no sanitized runtime dashboard response was captured for this account. Backend team: please confirm the canonical response shape below, return the activity feed and metrics from the authenticated recruiter organization, and provide a sanitized response captured from the running service.

## What the page needs

| Dashboard section | Data needed | Current frontend source |
|---|---|---|
| Welcome heading | Recruiter display name | Authenticated session user (`fullName`); dashboard endpoint need not duplicate it. |
| Organization summary | Organization name, city/state, verification state | Dashboard response `organization`. |
| Candidate Searches | Count and defined reporting period | Dashboard response metric. Backend must define what counts as a search. |
| Profiles Unlocked | Count of successful candidate unlocks | Dashboard response metric; frontend can fall back to purchased-candidate pagination total. Please confirm that purchased candidate count is equivalent to unlock count. |
| Shortlisted Candidates | Current shortlist count | Dashboard response metric; frontend can fall back to shortlist pagination total. |
| Available Credits | Current available credit balance | Dashboard response or `GET /api/recruiter/credits`. |
| Recommended Candidates | Candidate ID, professional title, specialty, location, experience, availability, credential verification, unlock/shortlist state | Dashboard response `recommendedCandidates`. |
| Recent Activity | Stable event ID, readable event description, event timestamp | Dashboard response `recentActivity`. This section currently renders empty because no recognized records are available to it. |
| Credit Balance panel | Available credits; optionally total/used values for the progress bar | `GET /api/recruiter/credits`. The current documented minimum includes `availableCredits`, `unlockCost`, and `ledger`; confirm whether total and used credit fields are available. |

## Requests made by the frontend

All endpoints use the configured API base (default `/api`) and require:

```http
Accept: application/json
Authorization: Bearer <access-token>
```

### 1. Dashboard

```http
GET /api/recruiter/dashboard
```

No query parameters and no request body. This should be the canonical source for organization summary, dashboard metrics, recommended candidates, and recent activity.

### 2. Credit balance fallback

```http
GET /api/recruiter/credits
```

No query parameters and no request body. The frontend uses this if the dashboard does not include the current credit balance.

### 3. Shortlist count fallback

```http
GET /api/recruiter/shortlisted-candidates?page=1&pageSize=1
```

No request body. The page reads the pagination total when the dashboard has no shortlist metric.

### 4. Unlocked/purchased count fallback

```http
GET /api/recruiter/purchased-candidates?page=1&pageSize=1
```

No request body. The page reads the pagination total when the dashboard has no unlocked metric. Please confirm this endpoint's total always represents unique, successfully unlocked candidate profiles.

The four reads are started together. A failure in the dashboard request is shown as a dashboard error; a failed supplemental request leaves that supplemental value unavailable unless the dashboard supplies it.

## Required dashboard response contract

Please confirm or adapt this proposed schema. It is a request for a stable contract, **not a claim that the running backend currently returns these exact keys**:

```json
{
  "success": true,
  "data": {
    "organization": {
      "organizationId": "<organization-id>",
      "name": "<organization-name>",
      "city": "<city>",
      "state": "<state>",
      "verificationStatus": "VERIFIED"
    },
    "metrics": {
      "candidateSearches": 76,
      "profilesUnlocked": 1,
      "shortlistedCandidates": 1,
      "availableCredits": 95,
      "period": "ALL_TIME",
      "asOf": "2026-10-21T10:30:00.000Z"
    },
    "recommendedCandidates": [
      {
        "candidateId": "<candidate-id>",
        "currentJobTitle": "Nurse - Critical Care",
        "specialty": "Nursing",
        "yearsOfExperience": 1,
        "city": "Trichy",
        "state": "Tamil Nadu",
        "openToWork": true,
        "credentialsVerified": true,
        "unlocked": true,
        "shortlisted": false,
        "skills": ["Critical Care", "ICU"]
      }
    ],
    "recentActivity": [
      {
        "activityId": "<activity-id>",
        "type": "CANDIDATE_UNLOCKED",
        "description": "Candidate profile unlocked (MH-10482)",
        "occurredAt": "2026-10-21T10:20:00.000Z"
      },
      {
        "activityId": "<activity-id>",
        "type": "CANDIDATE_SHORTLISTED",
        "description": "Candidate shortlisted (MH-10391)",
        "occurredAt": "2026-10-21T08:30:00.000Z"
      },
      {
        "activityId": "<activity-id>",
        "type": "CREDITS_PURCHASED",
        "description": "Credits purchased (50 credits)",
        "occurredAt": "2026-10-20T10:30:00.000Z"
      },
      {
        "activityId": "<activity-id>",
        "type": "CANDIDATE_PROFILE_VIEWED",
        "description": "Candidate profile viewed (MH-10256)",
        "occurredAt": "2026-10-19T10:30:00.000Z"
      }
    ]
  }
}
```

All IDs and activities above are placeholders. Return only real events for the authenticated organization; do not seed the Figma examples as account activity. Return an empty array when the organization has no activity, and include a stable unique ID per event.

## Required metric definitions

Please document the following semantics in the API reference and keep them consistent with the values returned by the dashboard:

1. **Candidate searches:** Count explicit recruiter search submissions, not page views, list-fetch GET requests, filter changes, or React development-mode effect replays. State whether the count is all-time or period-based. If the metric is period-based, include the start/end or period key.
2. **Profiles unlocked:** Count unique candidates successfully unlocked by the organization, or label it as unlock actions if repeated unlock attempts can be counted. State whether deleted/expired access changes the value.
3. **Shortlisted candidates:** Return the current number of shortlist entries, with a clear rule for duplicate entries and removed candidates.
4. **Available credits:** Return the current spendable balance. Define whether reserved, expired, promotional, or pending credits are included.
5. **Recent activity:** Define event types, ordering (newest first), maximum number of records, retention, and which actor's actions are included (recruiter only or all organization members).

### Search count duplication concern

The candidate search page currently fetches the candidate list on page mount and filters the loaded results locally when the recruiter submits the form. React Strict Mode is enabled in the frontend development entry point and can replay mount effects. The frontend now shares an in-flight candidate-list request to avoid that concurrent duplicate during development, but a page revisit still issues a new GET.

Therefore the dashboard search metric must not be implemented as a raw count of `GET /api/recruiter/candidates` requests. Please confirm the current counter implementation. If actual search submissions must be recorded, document the supported request/event contract for recording one explicit search action and the expected response. Do not silently increment the metric for ordinary list retrieval.

## Credit endpoint response to confirm

The current API comparison records a minimum documented response of `availableCredits`, `unlockCost`, and `ledger`. Please provide a sanitized live response and confirm whether `usedCredits` and `totalCredits` are supported for the Figma progress bar. Proposed shape if those values are available:

```json
{
  "success": true,
  "data": {
    "availableCredits": 95,
    "usedCredits": 94,
    "totalCredits": 189,
    "unlockCost": 1,
    "ledger": []
  }
}
```

The example values are illustrative. Frontend should not infer total credits or used credits when the API does not return them. The balance itself should still display when only `availableCredits` is provided.

## Recent Activity issue shown in the UI

The dashboard currently displays **“No recent activity.”** This means the frontend's normalized activity list is empty. It recognizes these top-level names: `recentActivity`, `recent_activity`, `recentActivities`, `recent_activities`, `activities`, or `activity`; entries may provide a description/message/text/title/action and an occurred-at/created-at/timestamp/date field.

Please investigate and return:

1. The exact sanitized response from `GET /api/recruiter/dashboard` for an organization with known activity.
2. Whether the service currently populates the activity feed and which database events feed it.
3. The actual field names and nesting/envelope for the activity list and records.
4. Whether events are scoped to the active organization and include all its members.
5. Whether the feed is ordered newest-first and has a maximum/retention policy.
6. A sanitized response for an organization with no activity, so the empty state contract is clear.

Please include HTTP status, error code/message, and `requestId` if the dashboard endpoint fails or omits expected data. No live backend response or request ID was captured for the screenshot; the screenshot only establishes that the UI rendered its empty state.

## Recommended candidate contract

Please confirm these fields on each `recommendedCandidates` item and state how many items the endpoint returns:

| Field | Purpose in UI | Required behavior |
|---|---|---|
| `candidateId` | Profile route and shortlist action | Stable ID accepted by recruiter candidate endpoints. |
| `currentJobTitle` | Candidate heading | Professional title; do not return a private name when the candidate is locked. |
| `specialty` / `skills` | Specialty badge and skill chips | Stable string or documented string-array shape. |
| `yearsOfExperience` | Experience summary | Number or documented display string. |
| `city`, `state` | Location summary | Null when not provided. |
| `openToWork` | Availability label | Boolean. |
| `credentialsVerified` | Verified Credentials badge | Boolean sourced from credential verification. |
| `unlocked` | Unlocked badge/access state | Boolean scoped to the current organization. |
| `shortlisted` | Bookmark state | Boolean scoped to the current organization. |

Return `recommendedCandidates: []` when there are no recommendations. Do not use sample or fabricated candidate records to fill the UI.

## Backend team response requested

Please reply with:

1. Confirmed endpoint methods, paths, auth/organization eligibility, and query/body requirements for each request above.
2. Canonical success response schemas and sanitized live examples for dashboard, credits, shortlist list, and purchased list.
3. Definitions and scope/period for all four dashboard metrics, especially candidate searches.
4. The activity event types, real data source, nesting, timestamp format, sort order, limit, and retention.
5. Recommendation field definitions, lock/privacy behavior, item limit, and organization scoping.
6. Canonical error status/code/message/requestId behavior for missing organization, pending verification, or insufficient access.
7. Whether frontend changes are needed to use a documented search-count event/request endpoint.

## Frontend behavior and current contract status

- Dashboard requests are authenticated GETs; dashboard has no query/body.
- Credit balance, shortlist total, and purchased/unlocked total use documented GET endpoints as fallbacks when dashboard metrics are absent.
- The frontend reads activity from common field aliases but does not synthesize activity records.
- The frontend formats timestamps for display and derives initials/location labels from returned values.
- Recommended candidates are rendered only when supplied; the dashboard otherwise shows an empty state.
- Candidate search UI currently fetches the directory on mount and performs text/filter matching locally. The dashboard's search count should reflect explicit search behavior as defined by the backend, not every directory GET.
- This handoff is based on frontend source, the existing API comparison document, and the supplied screenshots. It does not claim a live backend request was performed.

## References

- `2026-10-19-backend-api-mismatches/MEDHIRE_RECRUITER_FRONTEND_BACKEND_COMPARISON.md`, recruiter dashboard and related endpoint rows.
- `2026-10-19-backend-api-mismatches/MEDHIRE_BACKEND_API_MISMATCHES.md`, dashboard DTO definition and metric semantics gap.
- Frontend: `src/pages/recruiter/RecruiterDashboard.jsx`.
- Frontend: `src/pages/recruiter/RecruiterFindCandidates.jsx`.
- Frontend API methods: `src/lib/recruiterApi.js`.
