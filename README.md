# Inzira — Career Guidance Platform for Rwandan Students

Inzira ("the path") connects Rwandan O-level and A-level students with verified professionals to help them choose and pursue subject combinations with real career insight. Students book 1-on-1 mentorship sessions, enrol in group sessions, explore career stories, and track their confidence growth over time — guided by career guides and overseen by admins.

**GitHub:** https://github.com/gloriaumutoni/inzira

---

## Video Demo

> 5–10 minute walkthrough of all role flows — student, professional, company, counselor, admin.

_[Demo link — coming soon]_

---

## Designs

**Figma mockups:** _[Figma link — coming soon]_

### App screenshots

| Screen                                 | Preview                      |
| -------------------------------------- | ---------------------------- |
| Landing page                           | _[screenshot — coming soon]_ |
| Student dashboard                      | _[screenshot — coming soon]_ |
| Career explorer                        | _[screenshot — coming soon]_ |
| Professional profile + session booking | _[screenshot — coming soon]_ |
| Company workshop management            | _[screenshot — coming soon]_ |
| counselor's cohort dashboard           | _[screenshot — coming soon]_ |

---

## Setup

### Prerequisites

- Node.js 20+
- A Clerk account (free) — [clerk.com](https://clerk.com)
- A Supabase project (free) — [supabase.com](https://supabase.com)

### 1. Clone and install

```bash
git clone https://github.com/gloriaumutoni/inzira.git
cd inzira

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

Create `.env` files from the table below.

**`server/.env`**

```
DATABASE_URL=postgresql://...          # Supabase connection string
CLERK_SECRET_KEY=sk_...
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=                 # Sprint 2
CLOUDINARY_API_KEY=                    # Sprint 2
CLOUDINARY_API_SECRET=                 # Sprint 2
RESEND_API_KEY=                        # Sprint 3
```

**`client/.env`**

```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run locally

```bash
# Terminal 1
cd server && npm run dev        # → http://localhost:3001

# Terminal 2
cd client && npm run dev        # → http://localhost:5173
```

### 5. Verify the server

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","version":"1.0.0"}
```

---

## Deployment

| Service  | Host                             | Trigger                                         |
| -------- | -------------------------------- | ----------------------------------------------- |
| Frontend | [Vercel](https://vercel.com)     | Push to `main` → auto-deploy via GitHub Actions |
| Backend  | [Render](https://render.com)     | Push to `main` → deploy hook via GitHub Actions |
| Database | [Supabase](https://supabase.com) | Managed PostgreSQL — no deploy step             |

### GitHub secrets required

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                   | Where to get it                    |
| ------------------------ | ---------------------------------- |
| `VERCEL_TOKEN`           | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID`          | Vercel project settings            |
| `VERCEL_PROJECT_ID`      | Vercel project settings            |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Deploy Hook     |

### Production URLs

|        | URL                          |
| ------ | ---------------------------- |
| Client | _[Vercel URL — coming soon]_ |
| API    | _[Render URL — coming soon]_ |

---

## Roles

| Role              | What they can do                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Student (O-Level) | Take combination quiz, explore careers by interest, book 1-on-1 sessions, enrol in group sessions, browse career stories, log confidence |
| Student (A-Level) | Browse professionals by combination, filter group sessions and career stories by subject area, report session concerns, log confidence |
| Professional      | Write career stories, host 1-on-1 and group sessions (single or recurring), tag relevant subject combinations on profile              |
| Career Guide      | View student engagement table with confidence trends and session history, submit students for verification                            |
| Admin             | Manage verifications, create interview slots, export reports as PDF, oversee career stories and session safety reports                |

---

## Tech Stack

| Layer    | Tool                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6                    |
| Auth     | Clerk (JWT + session management)                                                  |
| HTTP     | Axios (interceptors attach Clerk JWT to every request)                            |
| Backend  | Express + TypeScript                                                              |
| ORM      | Prisma                                                                            |
| Database | Supabase (PostgreSQL)                                                             |
| Media    | Cloudinary                                                                        |
| Email    | Resend (session confirmations, report alerts, verification notifications)         |
| PDF      | jsPDF + jspdf-autotable (admin report exports)                                   |
| Deploy   | Vercel (client) + Render (server)                                                 |
| CI/CD    | GitHub Actions                                                                    |

---

## Features

### Career Stories
Professionals write short career stories about their journey. Students browse stories filtered by their subject combinations or career interests.

### Session Safety Reports
After a session, students can flag a concern. Reports are reviewed by admins from the Admin Safety dashboard.

### Confidence Tracking
Students log their confidence level (1–10) per subject combination after sessions or manually. Career guides can view confidence trends and deltas on the engagement table.

### Combination Quiz
O-Level students who haven't set a combination are prompted to take a quiz. Results navigate directly into the mentor search filtered by that combination.

### Recurring Mentor Slots
Professionals can create slots in two modes: a single date/time, or a recurring weekly schedule (choose days of the week and number of weeks: 2, 4, 8, or 12).

### Career Guide Engagement Table
Career guides see a sortable table of their students showing total sessions, last active date, baseline vs. current confidence delta, and a flag for students needing attention. Expandable rows show a confidence chart, session history, and combinations.

### PDF Export
Admins can export the full students, professionals, or career guides table as a PDF directly from the Reports page.

### Relevant Combinations (Professional)
Professionals tag the A-Level subject combinations most relevant to their career. These badges appear on their profile and are used to surface them in A-Level student mentor search.

---

## Project Structure

```
inzira/
├── .github/workflows/      CI, deploy-client, deploy-server
├── client/
│   └── src/
│       ├── api/            auth, professionals, careerStories, schools
│       ├── components/     ui/, layout/, auth/, landing/, professionals/, sessions/
│       ├── constants/      combinations.ts, sectors.ts
│       ├── contexts/       AuthContext, UIContext
│       ├── hooks/          useAuth, useRole, useGroupSessions, useCareerStory,
│       │                   useConfidenceLogs, usePendingReflections, useAdminReports, …
│       ├── lib/            api.ts (Axios instance)
│       ├── pages/
│       │   ├── admin/      AdminDashboard, AdminReports, AdminVerification,
│       │   │               AdminCareerStories, AdminSessionReports, AdminCreateSlots
│       │   ├── career-guide/  CareerGuideHome (engagement table + student detail)
│       │   ├── professional/  ProfessionalHome, ProfessionalCreateSlots,
│       │   │                  ProfessionalCareerStories, ProfessionalDashboard
│       │   └── student/    StudentHome, ALevelHome, ALevelSessions,
│       │                   StudentGetMentor, OLevelDashboard, ALevelDashboard
│       ├── routes/         AppRouter.tsx
│       └── types/          Shared TypeScript interfaces
└── server/
    └── src/
        ├── controllers/    One per resource (auth, professionals, careers,
        │                   careerStories, groupSessions, sessionReports, …)
        ├── middleware/     authMiddleware, roleGuard, errorHandler
        ├── prisma/         schema.prisma, migrations/, seed.ts
        ├── routes/         One file per resource
        ├── services/       email.service (Resend)
        └── utils/          response helpers, Cloudinary
```

---

© 2026 Inzira. Built for Rwandan students.
