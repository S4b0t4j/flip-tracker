# Flip Tracker - Real Estate Portfolio MVP

Desktop-first property tracker for solo house flippers. Track deal analysis, project progress, expenses vs budget, photo documentation, and generate lender-ready PDF reports.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS
- jsPDF + html2canvas for PDF generation
- Sonner for toasts, Lucide for icons

## Phase 1 scope (this build)

Auth, properties CRUD, expense tracking with budget vs actual, contractors, photo uploads + gallery, status tracking with auto-logged history, milestones, single-property PDF report, dark mode, sidebar/header layout, feedback form.

**Cut for Phase 2:** E2E client-side encryption, 2FA, rate limiting, audit logs, portfolio PDF, right-click context menus, SOX-style audit features. Per the user's review: pick a coherent encryption strategy before adding it back. Supabase's built-in encryption at rest + TLS is sufficient for MVP.

## Setup

### 1. Supabase project

1. Create a project at https://supabase.com
2. In SQL Editor, run `supabase/schema.sql`
3. Then run `supabase/storage.sql` to create buckets

### 2. Local env

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # only needed for the seed script
```

### 3. Install + run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. (Optional) Seed test data

```bash
npm run seed
```

Creates a test account: `test@example.com` / `password123` with three sample properties.

## Deployment (Vercel)

1. Push to GitHub
2. Import repo to Vercel
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars (no service role key in production unless you run the seed)
4. Deploy

## Architecture notes

- **App Router with route groups:** `app/(dashboard)` for protected pages, `app/auth` for sign-in/up, root `app/page.tsx` redirects.
- **Middleware** (`middleware.ts`) refreshes the Supabase session and gates protected routes.
- **RLS everywhere:** every table has policies. Child tables (expenses, contractors, photos, etc.) use a SECURITY DEFINER helper `owns_property()` to check ownership.
- **Auto-logging:** changing `properties.current_stage` fires a trigger that writes to `status_log`.
- **Auto user provisioning:** insert into `auth.users` triggers a row in `public.users` so the FK is always satisfied.
- **Client-side PDF generation:** the `/properties/[id]/report` page renders the report in DOM, then `html2canvas` + `jsPDF` snapshot each section onto a separate page. No server load.

## Browser support

Chrome, Safari, Firefox latest. Minimum width 1280px (no mobile).

## What's not built (deliberately)

- Mobile responsive layout (Phase 2)
- E2E encryption (review architectural decision before adding)
- 2FA / TOTP (Phase 2)
- Rate limiting (needs Upstash or similar; Phase 2)
- Audit logs (compliance feature; Phase 2)
- Portfolio aggregate PDF report (single-property is shipped; portfolio is straightforward to add by reusing `PropertyReport` patterns)
- Right-click context menus
- Full keyboard shortcut suite (search field is wired; rest deferred)
