# MedHire — React + Tailwind Build

Recreated from the Figma design system ("MedHire — SaaS Component Library & Guidelines")
using React 18, Tailwind CSS, react-router-dom, and lucide-react icons.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build -> dist/
npm run preview    # preview the production build
```

## What's included

- **Design tokens** (`tailwind.config.js`) — the exact color ramps from the Figma
  Color System panel (`brand` = Slate Blue, `accent` = Healthcare Teal, `ink` = Slate Grays).
- **Reusable UI kit** (`src/components/ui/`) — Button, Badge, Card, form controls
  (Input/Select/Toggle/Dropzone), StatCard, CandidateTable, Avatar, AlertBox,
  EmptyState, Accordion, Tabs — matching the "Component Library" page.
- **Layout** (`src/components/layout/`) — Navbar, Footer, Logo.
- **Pages** (`src/pages/`):
  - `Home.jsx` — full landing page (hero, stats, specialties, candidate/recruiter
    sections, process steps, marketplace preview, featured jobs, pricing,
    testimonials, FAQ, CTA band).
  - `About.jsx` — mission, problem/solution, values, security section.
  - `HowItWorks.jsx` — dual-timeline onboarding flow, verification standards,
    credential-unlock example.
  - `Placeholder.jsx` — stub for nav links (Find Jobs / For Recruiters / Pricing)
    not detailed in the source frames, so the nav doesn't 404.

Routing is handled with `react-router-dom`; swap `<BrowserRouter>` for your own
router or a static export step if deploying elsewhere.

Images are placeholder stock photography from Unsplash — swap in real assets
before shipping.
