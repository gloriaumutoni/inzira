# Inzira

> **"The path"** in Kinyarwanda — a career guidance platform built specifically for secondary school students in Kigali, Rwanda.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square)](https://inzira-self.vercel.app/)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [What Inzira Does](#what-inzira-does)
- [User Roles](#user-roles)
- [Core Functionalities](#core-functionalities)
- [Algorithms & Custom Logic](#algorithms--custom-logic)
- [Architecture & Code Quality](#architecture--code-quality)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Scope Alignment](#scope-alignment)
- [Prototype](#prototype)
- [Technical Walkthrough](#technical-walkthrough)

---

## Problem Statement

Rwanda's secondary education system requires every student to choose one of **15 A-Level subject combinations** at around age 15. This single decision permanently determines their university faculty and career trajectory. Most students make this choice based on parental pressure or peer influence — not on a genuine understanding of what different careers involve day to day.

Inzira solves this by connecting students directly with verified Rwandan professionals and approved mentors, enabling real career exploration before the combination decision is made.

**Pilot scope:** 3–4 partner schools across Gasabo and Nyarugenge districts in Kigali, targeting 100–150 students, 15–20 verified professionals, and 5–10 approved mentors.

---

## What Inzira Does

- Students explore a seeded career library mapped to Rwanda's 15 A-Level combinations
- Students join free group sessions hosted by verified professionals
- Approved mentors set weekly availability slots that students can book for 1-on-1 sessions
- Career guides from partner schools monitor their school's student engagement
- A two-stage verification system ensures all professionals and mentors are legitimate before interacting with students
- Admin manages the full platform: verification, schools, interview scheduling, and platform health

---

## User Roles

| Role | Description |
|---|---|
| **O-Level Student** | S1–S3, hasn't chosen a combination yet. Explores careers broadly, joins group sessions, tracks career confidence on a 1–5 scale |
| **A-Level Student** | S4–S6, combination already chosen. Discovers careers and mentors matched to their specific combination, books 1-on-1 sessions |
| **Professional** | Verified Rwandan working professional. Can create and host free group sessions for up to 30 students |
| **Mentor** | A verified professional who additionally passed an admin-conducted interview. Can create group sessions AND set bookable 1-on-1 availability slots |
| **Career Guide** | School staff with oversight of their school's students. Can view real student names, levels, combinations, confidence scores, and sessions attended |
| **Admin** | Full platform control: professional and mentor verification, school management, interview slot scheduling, platform health monitoring |

> **Key distinction:** All mentors are professionals, but not all professionals are mentors. Becoming a mentor requires a separate application and an admin-conducted interview, ensuring students only interact with people who are suited to working with teenagers.

---

## Core Functionalities

### Authentication & Verification
- Custom JWT auth with access tokens stored in memory and refresh tokens in `httpOnly` cookies
- Automatic token refresh via Axios interceptor on 401 responses
- Two-stage professional verification: account approval (LinkedIn-based, admin-reviewed) then mentor application (interview-based, admin-conducted)
- Career guide verification follows the same LinkedIn-review pattern as professionals
- Email notifications at every stage: admin alerted on new signup, applicant emailed on approve/decline

### Career Exploration
- Seeded career library of 30+ careers mapped to Rwanda's 15 A-Level combinations and 11 sectors
- Careers only surface to students when at least one verified mentor's sector matches — ensuring every displayed career has a real person behind it
- A-Level students see careers pre-filtered by their combination by default; O-Level students browse all

### Group Sessions
- Professionals and mentors create free group sessions with title, topic, date, join link, and a student cap (max 30)
- Students register and see live slot counts ("X slots left")
- Registered group sessions appear in the student's Sessions tab
- Professional sees real-time enrollment count and slots remaining

### Mentor 1-on-1 Booking
- Approved mentors set concrete availability slots (specific date, start time, end time, Google Meet link per slot)
- Students browse open slots grouped by day and book directly — no back-and-forth scheduling
- Race condition guard prevents two students from booking the same slot simultaneously
- Booked slot includes the Meet link delivered to the student at confirmation

### Admin Interview Scheduling
- Admin sets recurring weekly interview availability (day + time + Meet link)
- When a professional applies to be a mentor, they pick an available admin slot — the slot is removed from the pool immediately to prevent collisions
- Admin reviews applications through a slide-over panel: full professional details, interview date/time, Join Interview button, Mark as Interviewed action, then Approve or Decline

### Career Guide Student Visibility
- Career guides see a real student roster scoped strictly to their assigned school
- Student details visible: full name, level, combination (if A-Level), sessions attended, confidence level, join date
- Searchable and filterable client-side

### Schools Management
- Admin adds partner schools and assigns career guides
- Students select their school during signup, enabling school-scoped data for their career guide

---

## Algorithms & Custom Logic

### Weekly Slot Expansion (`server/src/utils/slots.ts`)
A pure utility function that takes a recurring weekly availability template (day of week + start/end time) and expands it into concrete datetime slots for the next N days. Used by both the admin interview slot system and the mentor availability system. Slots in the past (within a 2-hour buffer) are excluded automatically.

```typescript
expandWeeklyTemplate(templates, daysAhead = 14): Array<{ start: Date; end: Date }>
```

### Career-Mentor Visibility Rule
A career is visible to students if and only if at least one verified, active mentor's sector matches that career's sector. This is enforced server-side on `GET /careers`, ensuring the career library dynamically reflects who is actually available on the platform — empty careers with no real person behind them never appear.

### Combination-Based Professional Matching (`GET /professionals/recommended`)
For A-Level students, recommended professionals and mentors are surfaced by cross-referencing the student's combination against which careers map to that combination, then returning professionals/mentors linked to those careers. This gives students the most contextually relevant mentors without requiring them to search.

### Student Anonymisation
For any context where student identity must be protected (historically used for companies and workshops — these have been removed from the current scope), the system applies `S${id.slice(0,6).toUpperCase()}` as an anonymised code. Career guides are an exception: they have a legitimate school-staff relationship and see real student data scoped to their school only.

### Slot Race Condition Prevention
When a student books a mentor slot, the booking endpoint performs an atomic check-then-create using Prisma's `upsert` with a unique constraint on `(professionalId, scheduledAt)`. If two students submit simultaneously, the second receives a `409` with a clear "slot just taken" message rather than a silent duplicate booking.

### Auth Error Surface
Backend validation errors are written as human-readable strings and propagated through a consistent `{ success: false, error: "..." }` response shape. The frontend reads `response.data.error` directly and displays it in a styled alert block — no status codes exposed to users.

---

## Architecture & Code Quality

### Backend Structure
```
server/src/
├── controllers/     # One controller per resource, thin — delegates to services
├── services/        # Business logic layer (auth, email, slots utility)
├── routes/          # Express routers, one file per resource
├── middleware/       # JWT auth, role guards
├── utils/           # Pure functions (slot expansion, error helpers)
└── prisma/          # Schema, migrations, seed scripts
```

### Frontend Structure
```
client/src/
├── api/             # Axios instance with JWT interceptor + auth API functions
├── components/      # Shared UI (layout, sessions, professionals, admin, modals)
├── hooks/           # Custom data-fetching hooks (one per resource)
├── pages/           # Role-scoped page components
├── utils/           # Token management, sector colors, card styles, toast wrapper
└── types/           # Shared TypeScript interfaces
```

### Key Design Principles
- **Role-based rendering:** The `DashboardLayout` component dynamically selects nav items based on `role` and `isMentor` — one layout component serves all six roles without conditional spaghetti
- **Custom hooks:** Every API resource has a dedicated hook (`useCareers`, `useMentors`, `useStudentDashboard`, etc.) that encapsulates loading, error, and refetch state — pages stay declarative
- **No hardcoded data:** All content (careers, professionals, mentors, schools, stats) comes from the database — the frontend is a pure reflection of real data
- **Error-first design:** Every async action wraps in try/catch, surfaces backend error text to the user via the toast system, and never swallows errors silently
- **Separation of permissions:** `isVerified` (account approved) and `isMentor` (mentor interview passed) are independent flags — checked independently at both the backend route level and the frontend nav/page level

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6, Axios, recharts, sonner |
| **Backend** | Node.js + Express + TypeScript, Prisma ORM |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Custom JWT — access token in memory, refresh token in `httpOnly` cookie |
| **Email** | Resend |
| **Media** | Cloudinary |
| **Deploy** | Vercel (client), Render (server) |
| **CI/CD** | GitHub Actions — typecheck + build on PR, auto-deploy to Vercel and Render on merge to `main` |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project (PostgreSQL)
- A `.env` file in `server/` and `client/` (fill in the actual env variables in .env.example for everything to run)
- A Resend account for email notifications
- A Cloudinary account for media uploads

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/gloriaumutoni/inzira.git
cd inzira

# 2. Set up the server
cd server
npm install
cp .env.example .env        # fill in your values
npx prisma migrate dev       # run all migrations
npx prisma db seed           # seed careers and schools
npm run dev                  # starts on http://localhost:3001

# 3. Set up the client (new terminal)
cd client
npm install
cp .env.example .env        # fill in VITE_API_URL
npm run dev                  # starts on http://localhost:5173
```

### Creating an Admin Account
Admin accounts are not created through the public signup form. Seed one directly:

```bash
cd server
npx ts-node prisma/seed-admin.ts
```

Or insert directly via Supabase SQL editor — see `server/prisma/seed-admin.ts` for the expected shape.

---

## Environment Variables

### `server/.env`

```env
# Database — use port 5432 (direct), not 6543 (pooled)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@yourdomain.com

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# App
CLIENT_URL=http://localhost:5173
PORT=3001
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3001/api
```

> **Supabase note:** The free tier pauses projects after 1 week of inactivity. Restore manually from the Supabase dashboard before running locally or demoing.

---

## Testing

### Strategies Used

**1. Manual end-to-end testing across all six roles**
Each user flow was tested by creating real accounts and walking through the complete journey:
- Student signup → school selection → confidence rating → career exploration → group session registration → mentor slot booking
- Professional signup → admin verification email → waiting state → approval → group session creation
- Mentor application → interview slot selection → admin interview → approval → slot creation → student booking
- Career guide signup → approval → student roster visibility scoped to school
- Admin: verification queue, interview slot management, school assignment

**2. Edge case testing**
- Duplicate group session creation (same professional, same time) — returns 409, not a second record
- Race condition on slot booking (two students, same slot) — second request correctly rejected
- Email not found on login — descriptive error shown, no crash
- Wrong password — descriptive error shown
- A-Level student with no combination set — Explore Careers defaults gracefully to "Show all" instead of erroring
- Career guide with no assigned school — returns empty student list, not an error
- Mentor slot set in the past — filtered out by the 2-hour buffer rule

**3. Role-permission boundary testing**
- Non-mentor professional attempting to access `/professional/create-slots` — redirected to home
- Non-mentor professional attempting to access `/professional/mentees` — redirected to home
- Student attempting to book a non-mentor professional's 1-on-1 slot — backend returns 403
- Career guide attempting to view students from a different school — impossible by query scoping

**4. TypeScript compilation as a test layer**
Both client and server pass `npx tsc --noEmit` with zero errors before every merge to `main`. This is enforced by GitHub Actions CI.

**5. Database constraint testing**
- Unique constraint on `(professionalId, scheduledAt)` for `MentorSlot` — confirmed via Prisma migration and tested by attempting to insert duplicate rows

**6. Responsive design testing**
All screens tested at 375px (mobile), 768px (tablet), 1024px (laptop), and 1440px (desktop) using browser DevTools device simulation.

---

## Deployment

### Architecture

```
GitHub (main branch)
    │
    ├── GitHub Actions CI
    │   ├── Typecheck: client (tsc --noEmit)
    │   ├── Typecheck: server (tsc --noEmit)
    │   └── Build: client (vite build)
    │
    ├── Vercel (client)
    │   ├── Root directory: client
    │   ├── Build command: npm run build
    │   └── Output: dist/
    │
    └── Render (server)
        ├── Build command: npm install && npx prisma generate
        ├── Start command: npm run start
        └── Environment: Node 20
```

### Environments

| Environment | Client URL | Server URL |
|---|---|---|
| Production | [https://inzira.vercel.app](https://inzira-self.vercel.app/) | [https://inzira-api.onrender.com](https://dashboard.render.com/project/prj-d8u227rsq97s73cmfdkg) |
| Local dev | http://localhost:5173 | http://localhost:3001 |

### Deployment Steps

1. Push to `main` branch
2. GitHub Actions runs typecheck and build — fails fast if TypeScript errors exist
3. On success, Vercel auto-deploys the client (root directory: `client`)
4. On success, Render auto-deploys the server
5. Render runs `npx prisma generate` at build time to ensure the client matches the schema
6. Deployment verified by navigating to the production URL and completing a full signup flow

### Database Migrations in Production
New migrations are applied manually before deploying schema changes:
```bash
DATABASE_URL=<production_url> npx prisma migrate deploy
```
`migrate deploy` (not `migrate dev`) is used in production — it applies pending migrations without resetting data.

---

## Scope Alignment

The approved capstone proposal described a platform to help Kigali secondary students make informed A-Level combination decisions by connecting them with Rwandan professionals. The following summarises alignment and deliberate scope adjustments:

| Proposed Feature | Status | Notes |
|---|---|---|
| Career library mapped to 15 A-Level combinations | Implemented | 30+ careers seeded, sector-filtered |
| O-Level and A-Level student dashboards | Implemented | Separate flows, combination-aware |
| Professional verification and group sessions | Implemented | Two-stage: account + mentor interview |
| 1-on-1 mentor booking | Implemented | Custom slot system, no external calendar dependency |
| Career guide school oversight | Implemented | Real student data, school-scoped |
| Admin platform management | Implemented | Verification, schools, interview slots |
| Company workshops | Removed from scope | Deprioritised to focus on the core student-professional loop |
| MTN Mobile Money payments | Deferred | No production API available; payment infrastructure removed pending real integration |
| Google Calendar OAuth | Replaced | Replaced with a self-managed slot system to eliminate external OAuth dependency |

---

## Prototype

The original Figma prototype used during design and planning is available here:

**[View Figma Prototype](https://www.figma.com/your-prototype-link-here)**

> Replace the link above with the actual Figma share URL.

---

## Technical Walkthrough

A full technical walkthrough video covering the architecture, key implementation decisions, and a live demonstration of all six user flows is available here:

**[Demo of project](https://drive.google.com/drive/folders/1d1e1IUXN6L-Y7lwfnKcf8_p5PUPNpAfH?usp=drive_link)**

> Replace the link above with the actual video URL before submission.

---

## Repository

All commits follow a consistent pattern: `type(scope): description`
— e.g. `feat(auth): add linkedin verification for professionals` or
`fix(sessions): prevent duplicate group session creation`.

Branches are kept permanently as a record of each feature sprint —
never deleted after merging, per project convention.

---

_Built for the students of Rwanda. © 2026 Inzira._
