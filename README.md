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

## Confirmation emails

A confirmation goes out within seconds of the signup: an `after insert`
trigger invokes the mailer edge function. That is the delivery path.

Behind it sits a queue and a fifteen-minute sweep, and they exist for one
reason. Every free sending tier has a daily cap and a rate limit, so a send
can fail while the signup itself succeeds — the person never hears from us
and nobody finds out for weeks. The queue turns that into a delay. The
database holds the sending budget, so the sweep cadence controls only how
fast a backlog drains, never how much goes out.

Both paths call the same function. `claim_waitlist_confirmations()` hands out
work under a lease (`for update skip locked`, plus a timestamp that hides a
claimed row until the retry window elapses), so trigger and sweep can overlap
without mailing the same address twice.

The email is never sent from the browser. There is no client-safe Resend key —
one in the bundle would let anyone send mail as `woney.ai`. Routing through
the database also keeps signup and delivery independent: if Resend is down,
the form still succeeds.

Setup, in order:

1. Run [`supabase/waitlist-confirmation.sql`](./supabase/waitlist-confirmation.sql)
   in the SQL editor. It adds the queue columns and
   `claim_waitlist_confirmations()`, which hands out work under a lease so two
   overlapping runs cannot mail the same address twice.
2. In Resend, verify the `woney.ai` domain and add the DKIM, SPF and DMARC
   records it gives you. Create an API key.
3. Deploy the function:
   `supabase functions deploy send-waitlist-confirmation`
4. Set its secrets (*Edge Functions → Secrets*, or `supabase secrets set`):

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | `re_…` |
   | `WAITLIST_FROM` | `Woney <hello@woney.ai>` |
   | `WAITLIST_REPLY_TO` | `hello@woney.ai` (optional, this is the default) |
   | `WAITLIST_BATCH_SIZE` | optional, default `20` |
   | `WAITLIST_DAILY_CAP` | optional, default `95` |

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
5. Run [`supabase/waitlist-dispatch.sql`](./supabase/waitlist-dispatch.sql)
   after pasting a secret key into the placeholder. It stores the key in
   Vault, adds the insert trigger, and schedules the sweep.

Raise `WAITLIST_DAILY_CAP` when the Resend plan changes — it defaults to 95,
just under the free tier's 100 per day.

A dispatch failure never reaches the visitor. The trigger catches it, logs a
warning and lets the signup commit, because a signup we captured but did not
confirm is recoverable and a signup we refused is gone.

That leaves the failure invisible, so a second job closes the loop. Every
dispatch records its `pg_net` request id, and `check_waitlist_mailer_health()`
runs hourly to join those against the responses and raise a warning for any
non-2xx, or for any signup left unconfirmed past 45 minutes. Both surface
under *Logs → Postgres*. Without it a broken deploy is indistinguishable from
an empty queue — which is exactly how this pipeline once sat dead with a real
signup waiting in it.

### Sending vs. talking

Automated mail goes **out** through Resend, which signs it with DKIM on
`woney.ai`. Human mail comes **in** through Cloudflare Email Routing, which
forwards `hello@woney.ai` to a personal inbox; replies go back out through
Gmail's *Send mail as*. No Google Workspace seat is needed until there are
people who need mailboxes.

Automated and human mail stay on separate paths on purpose. A wave of bounces
from a signup spike must not touch the reputation of the address used to talk
to customers and investors. Sending bulk mail from Gmail is also against
Google's terms, and exceeding its limits suspends Gmail access for the whole
account, not just the send.

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
supabase/
  waitlist.sql               table + insert-only RLS policy
  waitlist-confirmation.sql  queue columns + claim function
  waitlist-dispatch.sql      insert trigger + sweep schedule
  functions/
    send-waitlist-confirmation/   edge function + email template
```

The Supabase SDK is dynamically imported inside `lib/supabase.ts` so it stays
out of the initial bundle. It only loads when someone submits the form.

## Reading signups

The publishable key cannot read the table. Use the Supabase dashboard, or
query with a secret key from a trusted server-side environment:

```sql
select email, source, referrer, created_at, confirmation_sent_at
from public.waitlist
order by created_at desc;
```

`source` is populated from `?utm_source=` or `?ref=` in the URL, so channel
attribution works from day one.
