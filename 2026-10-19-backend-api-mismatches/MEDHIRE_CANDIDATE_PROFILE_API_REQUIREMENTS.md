# Recruiter candidate profile: frontend display behavior

**Purpose:** document the recruiter profile UI against the current candidate detail API response.

## Before unlock

The backend returns `professionalSummary`, `skills`, `workExperience`, and `careerPreferences` in the flat `data` object even when `unlocked` is `false`. Display these returned professional values clearly without blur. Render available work-history fields (`jobTitle`, `employerName`, `employmentType`, `location`, dates, `currentlyWorking`, and `description`) and available career-preference fields. Handle absent or null values with concise empty states; do not fabricate candidate content.

Keep contact details masked before unlock. The frontend may use masked values from the response or display masked placeholders; it must not show the contact fields unmasked until unlock succeeds.

## After unlock

- Treat a successful `POST /api/recruiter/candidates/:candidateId/unlock` response as confirmation; it does not include a refreshed credit balance.
- Refetch `GET /api/recruiter/candidates/:candidateId` and display the returned contact fields and resume entries/links.
- Refresh the credit balance separately through `GET /api/recruiter/credits` if needed.
- Use the protected resume download route with the returned resume ID where applicable; do not expose resume downloads before unlock.

## Current response shape

`GET /api/recruiter/candidates/:candidateId` returns a flat object in `data`. Map fields directly from that object and do not require `{ candidate, profile, access, creditBalance }` nesting. An illustrative response shape is:

```json
{
  "success": true,
  "data": {
    "candidateId": "[CANDIDATE_ID]",
    "currentJobTitle": "[PROFESSIONAL_TITLE]",
    "professionalSummary": "[SUMMARY]",
    "skills": ["[SKILL]"],
    "workExperience": [
      {
        "jobTitle": "[JOB_TITLE]",
        "employerName": "[EMPLOYER]",
        "employmentType": "[TYPE]",
        "location": "[LOCATION]",
        "startMonth": "[MONTH]",
        "startYear": 2022,
        "endMonth": null,
        "endYear": null,
        "currentlyWorking": true,
        "description": "[DESCRIPTION]"
      }
    ],
    "careerPreferences": {
      "employmentTypes": ["[TYPE]"],
      "preferredLocations": ["[LOCATION]"],
      "shiftPreference": "[SHIFT]",
      "expectedSalary": null
    },
    "unlocked": false
  }
}
```

Example values are placeholders, not captured candidate data. Fields may be null or omitted. No backend response change is requested for the locked professional sections described above.
