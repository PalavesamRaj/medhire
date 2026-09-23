# Candidate dashboard and typography

## Preview

Run `npm run dev` and open `/candidate/dashboard`. This candidate area is a frontend demo: it does not call a backend, send applications to employers, activate account security, or delete accounts. Existing authentication and onboarding routes remain separate from the candidate dashboard layout.

Data lives in `CandidateDashboardContext` while moving between candidate dashboard routes. Refreshing the page or leaving that layout resets demo changes. Uploaded File objects remain in memory only; object URLs are revoked when resume rows unmount. An existing onboarding draft/current profile supplies the candidate's details instead of the Sarah Johnson demo profile. New candidates do not inherit demo applications, resumes, or activity.

## Typography

The existing project configures and loads **Inter**, not Geist. Inter is retained to preserve the current font system. No font package or external image source was introduced.

Reusable classes in `src/index.css` implement the supplied scale:

| Class | Size / line height / weight | Usage |
| --- | --- | --- |
| `med-display-lg` | 48px / 1.1 / 800 | Public heroes only; not used in candidate pages |
| `med-display-sm` | 32px / 1.2 / 700 | Candidate page and welcome headings; primary metric values |
| `med-heading-1` | 24px / 1.3 / 600 | Major content heading token |
| `med-heading-2` | 20px / 1.3 / 600 | Major sections |
| `med-heading-3` | 18px / 1.4 / 600 | Card and subsection headings |
| `med-body-lg` | 16px / 1.5 / 400 | Prominent descriptions |
| `med-body` | 14px / 1.5 / 400 | Standard content, forms |
| `med-caption` | 12px / 1.4 / 400 | Metadata and helper text |

Buttons and labels may use semibold versions of these sizes. Styles are additive and scoped; Tailwind utilities and existing authentication typography are not overwritten.

## Screens and interactions

| Page | Route | Functionality |
| --- | --- | --- |
| CandidateDashboard | `/candidate/dashboard` | Shared statistics, profile card, completion indicator, job recommendations, activity |
| MyProfile | `/candidate/profile` | Read-only summary, professional details, work, education, skills and certifications |
| EditProfile | `/candidate/edit-profile` | Controlled summary fields; Save updates shared state, Cancel discards local edits |
| ResumeManagement | `/candidate/resume-management` | File selection, validation, pending uploads, local view/download, remove confirmation, approved resume activation |
| PrivacySettings | `/candidate/privacy-settings` | Visibility and notification preferences, demo security toggle, local JSON export and demo deletion confirmation |
| JobSearch | `/candidate/jobs` | URL-backed title/company/location search and employment/specialty filters |
| JobDetails | `/candidate/jobs/:jobId` | Role details, responsibilities, requirements, save and apply actions; missing-job state |
| ApplyJob | `/candidate/jobs/:jobId/apply` | Approved resume selection, cover note, duplicate protection, mock submission and redirect |
| MyApplications | `/candidate/applications` | Derived statistics, application list and working text/status filters |
| SavedJobs | `/candidate/saved-jobs` | Shared bookmarks with details, remove and apply actions |
| CandidateSummary | `/candidate/summary` | Shared analytics and accessible performance chart |

The former `/candidate/profile` redirect now renders My Profile as requested. All nine explicit `/candidate/profile/*` onboarding routes are preserved. `Login.jsx` was not changed for this addition.

## Reusable architecture

`CandidateLayout` owns the header, responsive navigation and route outlet. `CandidateHeader` provides global job search, notifications and profile navigation. `CandidateSidebar` uses NavLink active states, including nested job routes. Narrow screens use a toggleable menu; the resume table scrolls inside its card.

`DashboardStatCard`, `JobCard`, `SaveJobButton`, `StatusBadge`, `ProfileSection`, `PageHeading`, `RecentActivity`, `ProfilePerformance` and `ConfirmDialog` provide shared visual and interaction patterns. The implementation reuses existing Button, Input, Select, Field, Badge, EmptyState and ToastProvider components.

The supplied ZIP was inspected and its SVG assets were extracted to `src/assets/candidate/`. `CandidateIcon` uses the supplied monochrome SVG shapes as CSS masks to support active colors without replacing their artwork. The local profile avatar and stethoscope assets are used directly. `public/candidate-demo-resume.pdf` is an explicitly labeled sample document for working preview/download controls.

Mock content is centralized in `candidateMockData.js`. `candidateDashboardState.js` contains profile mapping, the state reducer and job filtering. `CandidateDashboardContext.jsx` provides shared state and derives counts so bookmarks/applications stay consistent across screens. Demo counts follow the actual seeded arrays rather than the inconsistent counts across reference screenshots.

## Global validation switch

Edit **only** `src/lib/validationConfig.js`:

```js
export const VALIDATION_CONFIG = { enabled: true }
```

Set `enabled: false` to bypass dashboard and onboarding validator functions for development. Dashboard resume file selection also removes the accepted-file filter in this mode. Validation logic is in `candidateDashboardValidation.js` and `candidateProfileValidation.js`, not embedded in page markup. Structural controls, such as requiring a selected File before adding a resume and keeping stable list IDs, remain intact.

With validation enabled, uploads accept PDF/DOC/DOCX up to 5 MB, including a zero-length-file check. New files have `Pending Review` status and cannot be used in applications. At most one approved resume is active. Application validation rejects unapproved resumes, duplicate applications, and cover notes above 3,000 characters. Disabling frontend validation never replaces backend enforcement.

## Future API connection

`candidateDashboardApi.js` exports `getDashboard`, `getMyProfile`, `updateProfile`, `getResume`, `uploadResume`, `deleteResume`, `getPrivacySettings`, `updatePrivacySettings`, `searchJobs`, `getJobDetails`, `applyForJob`, `getApplications`, `getSavedJobs`, `saveJob`, `removeSavedJob`, and `getCandidateSummary` individually and as `candidateDashboardApi`.

It uses `VITE_API_BASE_URL || 'http://localhost:5000/api'`, central endpoint constants, `medhire_access_token` in the Bearer authorization header, JSON for structured payloads and FormData for resume files. IDs and filters are encoded. Requests time out after 30 seconds and surface unsuccessful responses. These functions are prepared but not called by the current mock UI; replace the context's mock loading/mutations with service responses when the backend contract is available. No silent fallback reports a failed real request as a successful mock mutation.

## Verification

```sh
npm run build
node --test tests/candidateProfile.test.mjs tests/candidateDashboard.test.mjs
node --experimental-websocket tests/candidate-browser.mjs
```

The browser script uses the existing Chrome installation (override its executable with `CHROME_PATH`) and Node's built-in WebSocket. It starts an isolated Vite server and temporary headless browser profile, checks all 11 routes at 1440px and 390px, asserts heading typography and active navigation, and exercises edit/save/cancel, privacy, search, bookmarks, apply/duplicate protection, resume validation/removal and existing onboarding/authentication routes. Screenshots and results are written to the ignored `artifacts/candidate-browser/` directory. No testing package was installed.
