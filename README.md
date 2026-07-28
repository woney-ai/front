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
policy that lets the anonymous browser client **insert only** — the list is
never readable from the frontend.

Copy the project URL and anon key from *Project settings → API* into
`.env.local`.

## Deploy (Vercel)

Import the repo. `vercel.json` already sets the Bun install/build commands.
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
for every environment, then deploy.

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

The anon key cannot read the table. Use the Supabase dashboard, or query with
the service role key from a trusted environment:

```sql
select email, source, referrer, created_at
from public.waitlist
order by created_at desc;
```

`source` is populated from `?utm_source=` or `?ref=` in the URL, so channel
attribution works from day one.
