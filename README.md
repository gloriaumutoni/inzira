# Inzira — Career Guidance Platform for Rwandan high school Students

Inzira ("the path") connects Rwandan O-level and A-level students with verified professionals to help them choose and pursue subject combinations and streams with real career insight. Students book 1-on-1 mentorship sessions, enrol in group sessions, explore career stories, and track their confidence growth over time, guided by career guides and overseen by admins.

**GitHub:** https://github.com/gloriaumutoni/inzira

---

## Video Demo

> Walkthrough of all role flows — student, professional, mentor, career guide, admin.

[Demon Link](https://drive.google.com/file/d/1AVh79hOl7cGBol9ceb1-5JnGup4c2L2x/view?usp=sharing)

---

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project 

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
DATABASE_URL=postgresql://...     
DIRECT_URL=postgresql://...

PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development" 
RESEND_API_KEY=...       
```

**`client/.env`**

```
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
curl http://localhost:3001/health
# → {"status":"ok","version":"1.0.0"}
```

---

## Testing Strategy & Results

Testing is layered across four strategies, each targeting a different class of bug:

| Layer                     | What it covers                                                                                   | Where                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Static typing (build gate) | TypeScript strict mode across client and server catches type-level bugs before runtime            | `tsc --noEmit`, run in CI on every push/PR                                          |
| Pure unit tests             | Deterministic logic with no external dependencies                                                 | `server/src/utils/slots.test.ts` — recurring slot expansion                        |
| Service-level tests         | Business rules and edge cases, with Prisma mocked so no live database is needed                   | `sessions.service`, `professionals.service`, `careerGuides.service`, `students.service`, `admin.service` |
| Controller-level tests      | Multi-step state-machine guards (order of checks matters)                                         | `professionals.controller.test.ts` — mentor application flow                       |
| Data-integrity tests        | Seeded reference data matches domain requirements                                                 | `client/src/constants/combinations.test.ts` (A-Level combinations), `client/src/constants/pathways.test.ts`                       |

**Edge cases exercised** include: booking capacity limits (max 3 upcoming sessions), duplicate free-intro prevention, professional monthly-quota exhaustion, already-booked slot conflicts, a `premiumSessionsPerMonth: 0` divide-by-zero case (documented rather than silently hidden), confidence-log fallback when a student has no logged history yet, null-confidence students in career-guide averages, pagination/export-cap on admin reports, and the full 6-guard mentor-application state machine (unverified → already-mentor → attempt limit → pending application → existing interview → slot already taken).

**Run the tests:**

```bash
cd server && npm test
cd client && npm test
```

**Environments exercised:** Node.js 20 on macOS (local development) and Ubuntu (GitHub Actions CI runner) for the automated suite; manual functional and responsive testing using Chrome desktop plus a mobile viewport for the UI.

---

## Analysis of Results

Mapping delivered functionality back to the project proposal's objectives:

| Proposal objective                                                              | Delivered                                                                                                                       | Status      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Two-stage verification (LinkedIn check, then admin interview for mentors)        | `Professional.isVerified` gates a separate `isMentor` / `mentorApplicationStatus` flow with its own interview-booking model      | Delivered   |
| Career library mapped to the A-Level combinations                             | `COMBINATIONS` seeds exactly 15 codes (`client/src/constants/combinations.ts`); a new `PATHWAY_LEAVES` taxonomy (`client/src/constants/pathways.ts`, 3 learning pathways / 4 streams) runs alongside it, with `CombinationPathwayPicker` and `studentTrack` supporting both during the curriculum transition | Delivered   |
| School-scoped visibility for career guides                                      | `careerGuides.service.getDashboard` filters students by the guide's `schoolId`                                                   | Delivered   |
| Free group sessions + bookable 1-on-1 mentorship                                 | `groupSessions.service` and `sessions.service` implement enrolment/booking with capacity and quota guards                        | Delivered   |
| Confidence tracking to measure decision-quality improvement                      | `ConfidenceLog` per session/manual entry, surfaced as deltas on the career-guide engagement table                                | Delivered   |
| Scope: Gasabo & Nyarugenge districts, 100–150 students, 15–20 professionals, 5–10 mentors | `School.district` field supports scoping; no load-testing has been run at full scale yet                                  | Partial     |
| Recurring mentor availability                                                    | `expandWeeklyTemplate` generates a full weekly-recurring series (1–12 weeks)                                                     | Delivered   |
| Recurring group sessions                                                        | Currently generates only the single next occurrence (`parentSessionId`-linked), not a full N-week series like mentor slots       | Partial     |

Overall, core functionality is implemented and technically aligned with the proposal's scope. 

---

## Deployment Plan & Execution

| Service  | Host                             | Trigger                                         |
| -------- | -------------------------------- | ----------------------------------------------- |
| Frontend | [Vercel]     | Push to `main` → auto-deploy via GitHub Actions |
| Backend  | [Render]    | Push to `main` → deploy hook via GitHub Actions |
| Database | [Supabase]| Managed PostgreSQL, no deploy step             |

### Deployment steps

1. **Migrate the database** — `npx prisma migrate deploy` against the Supabase `DATABASE_URL` (run once per schema change, before the backend that depends on it goes live).
2. **Deploy the backend** — push to `main` triggers the `deploy-server` GitHub Actions workflow, which calls the Render deploy hook.
3. **Deploy the frontend** — push to `main` triggers the `deploy-client` GitHub Actions workflow, which builds and deploys to Vercel.
4. **Verify** — hit the backend's `/health` endpoint in production and confirm the frontend loads and can reach the API (see Production URLs below).

### GitHub secrets required

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                   | Where to get it                    |
| ------------------------ | ---------------------------------- |
| `VERCEL_TOKEN`           | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID`          | Vercel project settings            |
| `VERCEL_PROJECT_ID`      | Vercel project settings            |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Deploy Hook     |

### Production URLs

|        | URL                                                  |
| ------ | ---------------------------------------------------- |
| Client | [Vercel](https://inzira-self.vercel.app/)            |

---

## Roles

| Role              | What they can do                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Student (O-Level) | Take streams quiz, explore careers by interest, book 1-on-1 sessions, enrol in group sessions, report session concerns, log confidence |
| Student (A-Level) | Browse professionals by combination and streams, filter group sessions and career stories by subject area, report session concerns, log confidence |
| Professional      | Write career stories, host group sessions , tag relevant subject combinations or streams on profile              |
| Mentor      | Write career stories, host 1-on-1 and group sessions , tag relevant subject combinations on profile              |
| Career Guide      | View student engagement table with confidence trends and session history                            |
| Admin             | Manage profesional, mentor,and career guides verifications, create interview slots, export reports as PDF, oversee career stories and session safety reports                |

---

## Tech Stack

| Layer    | Tool                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6                    |
| Auth     | JWT + session management                                                |
| HTTP     | Axios (interceptors attach JWT to every request)                            |
| Backend  | Express + TypeScript                                                              |
| ORM      | Prisma                                                                            |
| Database | Supabase (PostgreSQL)                                                             |
| Email    | Resend (session confirmations, report alerts, verification notifications)         |
| PDF      | jsPDF + jspdf-autotable (admin report exports)                                   |
| Caching  | node-cache (per-user TTL response cache on GET routes, `cacheMiddleware`)          |
| Deploy   | Vercel (client) + Render (server)                                                 |
| CI/CD    | GitHub Actions                                                                    |

---

## Features

### Career Stories
Professionals write short career stories about their journey. Students browse stories filtered by their subject combinations or career interests.

### Session Safety Reports
After a session, students can flag a concern. Reports are reviewed by admins from the Admin Safety dashboard.

### Stream Quiz
O-Level students who haven't set a stream are prompted to take a quiz (`PathwayQuiz.tsx`). Results navigate directly into the mentor search filtered by that streams.

### Combinations + Streams
Rwanda's curriculum is transitioning from the fixed A-Level combinations to a new learning pathway which are referred as streams (3 pathways, 4 leaf streams). Both are supported side by side: `CombinationPathwayPicker` renders combinations and stream options together, and `studentTrack` resolves whichever a student has (`combination` or `stream`) to a display label.

### Response Caching
GET routes across the API are wrapped in a TTL-based, per-user response cache (`cacheMiddleware`, `node-cache`) to cut redundant database load; writes aren't actively invalidated, entries simply expire.

### Recurring Mentor Slots
Professionals can create slots in two modes: a single date/time, or a recurring weekly schedule (choose days of the week and number of weeks: 2, 4, 8, or 12).

### Career Guide Engagement Table
Career guides see a sortable table of their students showing total sessions, last active date, baseline vs. current confidence, and a flag for students needing attention. Expandable rows show a confidence chart, session history, and subject study.

### PDF Export
Admins can export the full students, professionals, mentors or career guides table as a PDF directly from the Reports page.

### Relevant Combinations (Professional)
Professionals tag the A-Level subject combinations or streams most relevant to their career. These badges appear on their profile and are used to surface them in A-Level student mentor search.

---

## Project Structure

```
inzira/
├── .github/workflows/      CI, deploy-client, deploy-server
├── client/
│   └── src/
│       ├── api/            auth, professionals, careerStories, schools
│       ├── components/     ui/, layout/, auth/, landing/, professionals/, sessions/,
│       │                   shared/ (CombinationPathwayPicker)
│       ├── constants/      combinations.ts (combinations), pathways.ts, sectors.ts
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
│       │   └── student/    StudentHome, ALevelHome, ALevelSessions, PathwayQuiz,
│       │                   StudentGetMentor, OLevelDashboard, ALevelDashboard
│       ├── routes/         AppRouter.tsx
│       ├── types/          Shared TypeScript interfaces
│       └── utils/          studentTrack.tsx ( combination / streams)
└── server/
    └── src/
        ├── controllers/    One per resource (auth, professionals, careers,
        │                   careerStories, groupSessions, sessionReports)
        ├── middleware/     authMiddleware, roleGuard, errorHandler, cacheMiddleware
        ├── prisma/         schema.prisma, migrations/, seed.ts
        ├── routes/         One file per resource
        ├── services/       email.service (Resend)
        └── utils/          response helpers
```

---

© 2026 Inzira. Built for Rwandan students.
