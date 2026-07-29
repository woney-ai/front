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
   | `RESEND_API_KEY` | `re_…` (Sending access is enough) |
   | `RESEND_READ_API_KEY` | `re_…` with **Full access** — see below |
   | `WAITLIST_FROM` | `Woney <hello@woney.ai>` |
   | `WAITLIST_REPLY_TO` | `hello@woney.ai` (optional, this is the default) |
   | `WAITLIST_BATCH_SIZE` | optional, default `20` |
   | `WAITLIST_DAILY_CAP` | optional, default `95` |
   | `WAITLIST_RECONCILE_BATCH_SIZE` | optional, default `100` |

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
5. Run [`supabase/waitlist-dispatch.sql`](./supabase/waitlist-dispatch.sql)
   after pasting a secret key into the placeholder. It stores the key in
   Vault, adds the insert trigger, and schedules the sweep.

Raise `WAITLIST_DAILY_CAP` when the Resend plan changes — it defaults to 95,
just under the free tier's 100 per day.

The sweep costs nothing when there is nothing to do: `invoke_waitlist_mailer()`
checks for pending rows before it opens a connection, so a quiet night is 96
index lookups rather than 96 function invocations.

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

### Validating an address

Three different problems wear the same name, and only the first is validation.

The form checks **syntax** with Zod's HTML5 pattern, the same one the browser
enforces on `type="email"`, so the field and the schema never disagree.

The mailer checks whether the **domain can receive mail at all** — an MX
lookup, falling back to an A record for hosts that accept mail under the
implicit-MX rule. No mail exchanger means the address cannot work, so the row
is marked `invalid-domain` and never sent. That is the one bounce worth
preventing rather than reporting. The check is three-valued: only an
authoritative not-found rejects an address, and a resolver timeout sends
anyway, because refusing a real person over a DNS hiccup is the worse failure.

Whether the **mailbox exists** is not answerable from here, by any library.
`unclaimed.mailbox@gmail.com` passes both checks and still hard bounces — the
domain is real, the address belongs to nobody. Only delivery answers that,
which is what the next section is for.

### Knowing what actually arrived

`confirmation_sent_at` means Resend accepted the message. Whether a human
received it is decided later by the receiving server, and nothing reports it
back — so the table can say a hundred confirmations went out while a quarter
of them bounced, and be truthful about it.

That gap costs nothing today and everything on launch day, which is the one
send that has to land. Mailing an address book of unknown quality in a single
burst is how a young domain teaches Gmail to distrust it.

Run [`supabase/waitlist-delivery.sql`](./supabase/waitlist-delivery.sql) and
deploy `reconcile-waitlist-delivery`. Every send stores its provider message
id; a job every six hours asks Resend what became of each one and writes the
answer to `delivery_status`. The health check warns when bounces pass ten per
cent of resolved messages over a week, which is roughly where mailbox
providers start treating a domain as careless.

Six hours rather than minutes, and the spacing is a feature. Asking too soon
catches a message still queued and buys another poll later; asking once, late,
gets a settled answer the first time. Two numbers are tied to that cadence and
must move with it: `recheck_after` has to stay well under it, or the lease
expires just after each run begins and every row waits for the following pass;
and the health check's unresolved threshold is twice the cadence, because a
message sent right after a run legitimately waits nearly six hours for its
first poll.

It polls rather than taking a webhook. A webhook buys latency nothing here
consumes — nobody acts on a bounce in real time — and costs a public endpoint,
signature verification and another surface to defend.

The reconciler needs its own key. Resend has no read-only permission, so
retrieving a message requires **Full access**, while sending needs only
*Sending access*. They stay separate: the send path runs far more often and the
narrow key is the one worth keeping there. A Sending-only key in
`RESEND_READ_API_KEY` fails in the quietest possible way — mail goes out
normally, every poll 401s, and `delivery_status` stays null forever. The health
check watches for exactly that and warns once a sent message has gone twelve
hours without a status. Expect to hear about it in half a day, not in an hour:
the reconciler runs every six, so anything tighter would fire during normal
operation.

This is also the query that says what the list is worth:

```sql
select
  count(*)                                             as captured,
  count(*) filter (where delivery_status = 'delivered') as delivered,
  count(*) filter (where delivery_status = 'bounced')   as bounced,
  count(*) filter (where delivery_status is null)       as unknown
from public.waitlist;
```

### Abuse

The insert policy is open to `anon` by necessity — the form posts straight to
PostgREST with a key that ships in the bundle. Once every insert costs a real
send, a scripted flood stops being a nuisance and starts costing the day's
budget and the sending domain's reputation.

Run [`supabase/waitlist-rate-limit.sql`](./supabase/waitlist-rate-limit.sql)
for the first layer: five signups per address per hour, enforced by a `before
insert` trigger reading `x-forwarded-for`. Rejections come back as HTTP 429,
which the form reports as a wait rather than a failure.

The second layer sits in `claim_waitlist_confirmations()`. Past 60 signups in
an hour it stops handing out work and logs a warning, so an implausible hour
never reaches the mail provider. Signups are still captured — the same trade
as a failed dispatch, since one we hold is recoverable and one we refuse is
gone. It defers rather than resolves: the queue is still there afterwards, and
the warning is what buys you time to delete the junk before it is mailed.

Neither layer stops an attacker rotating addresses. That needs a proof of work
in the browser — Turnstile or hCaptcha in front of the insert — and is worth
doing the day this link gets real attention.

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
  waitlist-dispatch.sql      insert trigger, sweep schedule, health check
  waitlist-rate-limit.sql    per-address throttle on the public insert
  waitlist-delivery.sql      delivery reconciliation + schedule
  functions/
    send-waitlist-confirmation/   edge function + email template
    reconcile-waitlist-delivery/  asks Resend what actually arrived
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
