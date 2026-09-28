# Sahakar Bharati — Sweet Pre-Booking & Sale-Center Platform

**सहकार भारती मिठाई एडवांस प्री-बुकिंग एवं बिक्री केंद्र प्रबंधन प्लेटफ़ॉर्म**

A full-stack platform for cooperative festival sweet distribution: customers and
Sahakar Mitra agents place advance pre-bookings, sale centers plan production and
handle OTP-verified pickups, and city/national administrators manage the catalog,
pricing, discounts, and mitra network.

Version: **1.0.0**

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL (Supabase) via Drizzle ORM
- **Auth:** JWT session cookies (`jose`) + bcrypt PIN hashing, per-user roles
- **Payments:** Zoho Payments integration
- **Charts:** Recharts

## Roles

| Role | Capabilities |
|---|---|
| Customer | Browse catalog, place pre-bookings, view own orders |
| Sahakar Mitra | Group bookings, commission/credit tracking |
| Sale Center (Kendra) | Demand planning, OTP delivery, mitra ledger — scoped to own center |
| City Admin | Center allocation, city pricing, mitra approvals, discounts — scoped to own city |
| Super Admin | National catalog, festivals, city network, records console |

## Getting Started

**Prerequisites:** Node.js 18+ and a PostgreSQL database (Supabase recommended).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables — copy the template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   See [Environment Variables](#environment-variables) below.
3. Run the development server:
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:3000

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check `app/` and `lib/` with `tsc` |
| `npm run db:backup` | Back up the database |
| `npm run db:export` / `db:import` | Export / import data |

## Environment Variables

Set these in `.env` (local) or your host's environment settings (production).
Never commit `.env` — it is git-ignored.

**Database**
- `DATABASE_URL` — Postgres connection string
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

**Client (browser-exposed)**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Session / Auth**
- `SESSION_SECRET` — strong (≥32 char) secret for signing session cookies
- `DEV_ADMIN_PHONE`, `DEV_ADMIN_PIN_HASH` — proof-of-concept dev admin

**Zoho Payments**
- `ZOHO_PAYMENTS_ACCOUNT_ID`, `ZOHO_PAYMENTS_CLIENT_ID`,
  `ZOHO_PAYMENTS_CLIENT_SECRET`, `ZOHO_PAYMENTS_API_KEY`, `ZOHO_PAYMENTS_DOMAIN`

## Deployment

The app deploys to Vercel as a standard Next.js project (`vercel.json` sets the
framework preset). Configure all environment variables above in the host's
project settings before deploying.

## Documentation

- [Database schema](docs/database-schema.md)
