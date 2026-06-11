# Inzira — Career Guidance Platform for Rwandan Students

Inzira ("the path" in Kinyarwanda) connects Rwandan secondary school students
with verified professionals and companies to help them make informed career and
A-level subject combination choices.

---

## Problem

Rwandan O-level students choose their A-level subject combinations with very
little exposure to the careers those combinations lead to. This decision shapes
their university options and professional trajectory — yet most students make it
based on peer pressure or parental preference rather than lived insight from
professionals already working in those fields.

## Solution

Inzira provides:
- **Interest assessments** mapped to Rwanda's 15 A-level subject combinations
- **Professional profiles** and 30-minute mentorship sessions
- **Company workshops** hosted by Kigali companies
- **Career explorer** with real O-level and A-level combination mappings

Pilot: Gasabo and Nyarugenge districts — 100–150 students, 15–20 professionals,
5–8 companies.

---

## Roles

| Role               | Permissions                                                   |
| ------------------ | ------------------------------------------------------------- |
| Student            | Interest assessment, browse careers, book sessions, workshops |
| Professional       | Host sessions, manage public profile                          |
| Company            | Create and manage workshops                                   |
| SchoolCoordinator  | Read-only cohort dashboard                                    |
| Admin              | Full platform management                                      |

---

## Tech Stack

| Layer      | Tool                  | Why                                                           |
| ---------- | --------------------- | ------------------------------------------------------------- |
| Frontend   | React 18 + TypeScript | Component model + type safety across the full stack           |
| Build tool | Vite                  | Fast HMR, native ESM, first-class TypeScript support          |
| Styling    | Tailwind CSS v3       | Utility-first — design tokens enforced via config             |
| Routing    | React Router v6       | Nested routes + loader pattern for role-based navigation      |
| Auth       | Clerk                 | Handles JWT, session management, and role metadata out of box |
| HTTP       | Axios                 | Interceptors for attaching Clerk JWT to every API request     |
| Backend    | Express + TypeScript  | Minimal, familiar, easy to layer middleware on                |
| ORM        | Prisma                | Type-safe queries generated from schema, migration tooling    |
| Database   | Supabase (PostgreSQL) | Managed Postgres, free tier, row-level security support       |
| Media      | Cloudinary            | CDN + transformation pipeline for professional profile videos |
| Email      | Resend                | Developer-friendly transactional email with React templates   |
| Deploy     | Vercel + Render       | Zero-config deploys; Vercel for client, Render for server     |
| CI/CD      | GitHub Actions        | Type-check + Prisma validate on every push                    |

---

## Project Structure

```
inzira/
├── .github/workflows/      GitHub Actions CI/CD pipelines
├── client/                 React frontend (Vite)
│   ├── public/             Static assets
│   └── src/
│       ├── components/
│       │   ├── ui/         Button, Card, Input, Badge, Spinner
│       │   ├── layout/     Navbar, PageWrapper
│       │   └── auth/       RoleGuard, ProtectedRoute
│       ├── contexts/       AuthContext, UIContext
│       ├── hooks/          useAuth, useRole, useUser
│       ├── lib/            Axios instance (api.ts)
│       ├── pages/          Landing, Login, NotFound, dashboards/
│       ├── routes/         AppRouter.tsx
│       └── types/          Shared TypeScript interfaces
└── server/                 Express backend
    └── src/
        ├── middleware/     authMiddleware, roleGuard, errorHandler
        ├── prisma/         schema.prisma, singleton client
        ├── routes/         One file per resource
        ├── utils/          response helpers, SDK inits
        └── types/          Role enum, Express augmentation
```

---

## Setup

### Prerequisites
- Node.js 20+
- A Clerk account (free) — [clerk.com](https://clerk.com)
- A Supabase project (free) — [supabase.com](https://supabase.com)

### 1. Clone and install

```bash
git clone https://github.com/your-org/inzira.git
cd inzira

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Fill in DATABASE_URL, CLERK_SECRET_KEY, and optional SDK keys

# Client
cp client/.env.example client/.env
# Fill in VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start development servers

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Backend runs on http://localhost:3001  
Frontend runs on http://localhost:5173

### 5. Verify

```bash
curl http://localhost:3001/api/v1/health
# → {"status":"ok","version":"1.0.0"}
```

---

## Environment Variables

See `server/.env.example` and `client/.env.example` for full documentation.

| Variable                    | Service    | Required |
| --------------------------- | ---------- | -------- |
| `DATABASE_URL`              | Supabase   | Yes      |
| `CLERK_SECRET_KEY`          | Clerk      | Yes      |
| `CORS_ORIGIN`               | Server     | Yes      |
| `VITE_CLERK_PUBLISHABLE_KEY`| Clerk      | Yes      |
| `VITE_API_BASE_URL`         | Client     | Yes      |
| `CLOUDINARY_CLOUD_NAME`     | Cloudinary | Sprint 2 |
| `RESEND_API_KEY`            | Resend     | Sprint 3 |

---

## Sprints

| Sprint | Dates          | Focus                                      |
| ------ | -------------- | ------------------------------------------ |
| S1     | Jun 8 – Jun 19 | Infrastructure, auth, CI/CD, core UI       |
| S2     | Jun 19 – Jul 1 | Career explorer, profiles, session booking |
| S3     | Jul 1 – Jul 13 | Workshops, coordinator dashboard, notifications |
| S4     | Jul 13 – Jul 24| PWA, testing, cleanup, presentation        |

---

© 2026 Inzira. Built for Rwandan students.
