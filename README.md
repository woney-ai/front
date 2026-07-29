# Woney — waitlist

Landing page for Woney. Woney issues single-use virtual cards to AI agents so
they can complete purchases at ecommerce checkouts on behalf of an end user —
each card locked to one merchant, one amount, one transaction. This page tests
appetite for that and captures end-user emails.

**Stack:** Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · Bun · Vercel

## Setup

```bash
bun install
cp .env.example .env.local   # fill in your Supabase values
bun dev
```

### Supabase

Create a project, then run [`supabase/waitlist.sql`](./supabase/waitlist.sql)
in the SQL editor. It creates the `waitlist` table and a row level security
policy that lets the browser client **insert only** — the list is never
readable from the frontend.

Copy the project URL and the **publishable key** (`sb_publishable_…`) from
*Project Settings → API Keys* into `.env.local`.

### About the keys

Supabase replaced the legacy JWT keys: `sb_publishable_…` supersedes `anon`,
and `sb_secret_…` supersedes `service_role`. The legacy pair still works but
is deprecated through the end of 2026, so new projects should use the new
format. Either value works in `createClient` if you are on an older project.

The publishable key is public by design and ships in the bundle. It resolves
to Postgres' `anon` role, so the RLS policy in `waitlist.sql` is what actually
protects the data — which is why that policy grants `insert` and nothing else.

A secret key must never appear in a `VITE_` variable. Anything prefixed with
`VITE_` is inlined into the client bundle at build time.

## Deploy (Vercel)

Import the repo. `vercel.json` already sets the Bun install/build commands.
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment
variables for Production, Preview **and** Development, then deploy.

Vite inlines env vars at build time, so changing them requires a redeploy —
editing them in the dashboard does not update an existing deployment.

## Structure

```
src/
  components/
    brand/       logo
    layout/      header, footer
    sections/    hero, how-it-works, capabilities, audiences, closing-cta
    ui/          shadcn primitives
  features/
    waitlist/    schema, api, form — the only real behavior on the page
  lib/           env guard, supabase client, cn
supabase/        waitlist.sql
```

The Supabase SDK is dynamically imported inside `lib/supabase.ts` so it stays
out of the initial bundle. It only loads when someone submits the form.

## Reading signups

The publishable key cannot read the table. Use the Supabase dashboard, or
query with a secret key from a trusted server-side environment:

```sql
select email, source, referrer, created_at
from public.waitlist
order by created_at desc;
```

`source` is populated from `?utm_source=` or `?ref=` in the URL, so channel
attribution works from day one.
