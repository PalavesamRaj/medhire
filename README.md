# MedHire Frontend Prototype

This workspace contains the Candidate and Recruiter frontend in this project and the Admin frontend in the sibling `D:\08-10-2026\adminportal2026` project. Use the [frontend prototype guide](artifacts/MEDHIRE_FRONTEND_PROTOTYPE_GUIDE.md) for launch steps, routes, and the complete screen map.

## Candidate and Recruiter app

```powershell
cd D:\08-10-2026\medhire-main
npm install
npm run dev
```

Open `http://localhost:5173`. For the clickable visual design preview of Candidate, Recruiter, and Admin, open `http://localhost:5173/prototype`; it uses sample data and does not need the API. Candidate and recruiter registration, sign-in, profile onboarding, dashboards, and workspace screens live in the same app. Sign-in and protected workspace flows require the API configured through `VITE_API_BASE_URL` or the development `/api` proxy.

## Admin app

In a second terminal:

```powershell
cd D:\08-10-2026\adminportal2026
npm install
npm run dev -- --port 5174
```

Open `http://localhost:5174/login`. Production builds require `VITE_API_BASE_URL` for the Admin API. The Admin app is a separate Vite project.

## Build

Run `npm run build` in each project. A successful frontend build checks compilation only; it does not verify API availability or complete end-to-end workflows.
