# Inzira

> "The path" in Kinyarwanda — a career guidance platform for secondary school students in Kigali, Rwanda.

## What it does

Inzira connects secondary school students with verified Rwandan professionals and companies to help them make informed A-Level subject combination choices.

## Five user roles

- **O-Level Students** — explore careers broadly before choosing a combination
- **A-Level Students** — deepen career focus within their chosen combination
- **Professionals** — mentor students via group sessions and 1-on-1 calls
- **Companies** — host free career workshops for A-Level students
- **Career Guides** — school staff with read-only oversight of student engagement
- **Admin** — manages verification, schools, and platform settings

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6, Axios, recharts |
| Backend | Node.js + Express + TypeScript, Prisma ORM |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (access token in memory, refresh token in httpOnly cookie) |
| Payments | MTN Mobile Money (mocked in dev) |
| Calendar | Google Calendar API (OAuth for professionals) |
| Media | Cloudinary |
| Email | Resend |
| Deploy | Vercel (client), Render (server) |

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project
- A `.env` file in `server/` (see `.env.example`)
- A `.env` file in `client/` (see `.env.example`)

### Run locally

```bash
# Server
cd server
npm install
npx prisma migrate dev
npm run dev

# Client (separate terminal)
cd client
npm install
npm run dev
```

## Environment variables

### server/.env

```
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RESEND_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google-calendar/callback
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_SUBSCRIPTION_KEY=...
MOMO_ENVIRONMENT=sandbox
```

### client/.env

```
VITE_API_URL=http://localhost:3001/api
```

## Deployment

- Client deploys to Vercel automatically on push to `main`
- Server deploys to Render automatically on push to `main`
- Root directory for Vercel is set to `client`
