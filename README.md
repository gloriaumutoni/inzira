# Inzira — Career Guidance Platform for Rwandan Students

Inzira ("the path") connects Rwandan O-level students with verified professionals
and companies to help them choose A-level subject combinations with real career insight.

**GitHub:** https://github.com/gloriaumutoni/inzira

---

## Video Demo

> 5–10 minute walkthrough of all role flows — student, professional, company, coordinator, admin.

_[Demo link — coming soon]_

---

## Designs

**Figma mockups:** _[Figma link — coming soon]_

### App screenshots

| Screen | Preview |
| ------ | ------- |
| Landing page | _[screenshot — coming soon]_ |
| Student dashboard | _[screenshot — coming soon]_ |
| Career explorer | _[screenshot — coming soon]_ |
| Professional profile + session booking | _[screenshot — coming soon]_ |
| Company workshop management | _[screenshot — coming soon]_ |
| Coordinator cohort dashboard | _[screenshot — coming soon]_ |

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
curl http://localhost:3001/api/v1/health
# → {"status":"ok","version":"1.0.0"}
```

---

## Deployment

| Service | Host | Trigger |
| ------- | ---- | ------- |
| Frontend | [Vercel](https://vercel.com) | Push to `main` → auto-deploy via GitHub Actions |
| Backend | [Render](https://render.com) | Push to `main` → deploy hook via GitHub Actions |
| Database | [Supabase](https://supabase.com) | Managed PostgreSQL — no deploy step |

### GitHub secrets required

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
| ------ | --------------- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Deploy Hook |

### Production URLs

| | URL |
| - | --- |
| Client | _[Vercel URL — coming soon]_ |
| API | _[Render URL — coming soon]_ |

---

## Roles

| Role | What they can do |
| ---- | ---------------- |
| Student | Interest assessment, browse careers, book sessions, register for workshops |
| Professional | Host mentorship sessions, manage public profile |
| Company | Create and manage workshops |
| SchoolCoordinator | Read-only cohort dashboard |
| Admin | Full platform management |

---

## Tech Stack

| Layer | Tool |
| ----- | ---- |
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6 |
| Auth | Clerk (JWT + session management) |
| HTTP | Axios (interceptors attach Clerk JWT to every request) |
| Backend | Express + TypeScript |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Media | Cloudinary |
| Email | Resend |
| Deploy | Vercel (client) + Render (server) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
inzira/
├── .github/workflows/      CI, deploy-client, deploy-server
├── client/
│   └── src/
│       ├── components/     ui/, layout/, auth/
│       ├── contexts/       AuthContext, UIContext
│       ├── hooks/          useAuth, useRole, useUser
│       ├── lib/            api.ts (Axios instance)
│       ├── pages/          Landing, Login, dashboards/
│       ├── routes/         AppRouter.tsx
│       └── types/          Shared TypeScript interfaces
└── server/
    └── src/
        ├── middleware/     authMiddleware, roleGuard, errorHandler
        ├── prisma/         schema.prisma, client singleton
        ├── routes/         One file per resource
        └── utils/          response helpers, Cloudinary, Resend
```

---

© 2026 Inzira. Built for Rwandan students.
