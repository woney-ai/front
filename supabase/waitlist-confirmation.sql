-- Woney waitlist — confirmation email queue.
-- Run this once in the Supabase SQL editor, after waitlist.sql.
--
-- Confirmations are not sent when the row is inserted. They are queued here
-- and drained by the `send-waitlist-confirmation` edge function. A signup
-- spike therefore becomes a delay rather than a dropped email once the
-- sending provider's daily cap is reached.

alter table public.waitlist
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmation_attempts integer not null default 0,
  add column if not exists confirmation_last_attempt_at timestamptz;

-- Partial index. The queue only ever scans unsent rows, and that set stays
-- small no matter how large the table grows.
create index if not exists waitlist_confirmation_pending_idx
  on public.waitlist (created_at)
  where confirmation_sent_at is null;

-- Supabase grants `anon` and `authenticated` every table privilege by
-- default; only RLS holds them back. The insert policy restricts which rows
-- may be written, but says nothing about which *columns*, so a crafted
-- request could insert a row with confirmation_sent_at already populated and
-- silently opt itself out of the queue. Column-level privileges are what
-- actually constrain the shape of the row.
revoke all on public.waitlist from anon, authenticated;
grant insert (email, source, referrer) on public.waitlist to anon;

-- Claims a batch of pending confirmations and returns them.
--
-- The claim and the read happen in one statement, so two overlapping cron
-- runs can never hand the same address to the mailer twice:
--   * `for update skip locked` keeps concurrent runs off the same rows
--   * bumping confirmation_last_attempt_at acts as a lease — a row that was
--     claimed but never confirmed is invisible until retry_after elapses
--   * confirmation_attempts caps how many times a permanently failing
--     address is retried before it is abandoned
--
-- daily_cap is measured against a rolling 24 hours rather than a calendar
-- day, which is the conservative reading of a provider's "per day" limit.
create or replace function public.claim_waitlist_confirmations(
  batch_size integer default 20,
  daily_cap integer default 95,
  max_attempts integer default 5,
  retry_after interval default interval '15 minutes'
)
returns table (id uuid, email text)
language plpgsql
as $$
declare
  spent  integer;
  budget integer;
begin
  -- Two things have to be true for the cap to hold, and `for update skip
  -- locked` below gives neither. It serializes which *rows* each caller takes;
  -- it does nothing about how much budget each caller thinks it has.
  --
  -- First, no two callers may compute a budget from the same snapshot. The
  -- insert trigger fires per statement and the sweep runs on its own schedule,
  -- so they overlap routinely. This lock makes the read-then-claim atomic
  -- against other claims. It is held only for the claim — sending happens
  -- after this function returns — so contention is a few milliseconds.
  perform pg_advisory_xact_lock(4162003001);

  -- Second, budget has to count sends already in flight. `confirmation_sent_at`
  -- is written after the Resend round-trip, so a claimed-but-unsent row is a
  -- send that will happen and that nothing else can see yet. Counting only
  -- delivered rows means two callers a second apart both believe the same slot
  -- is free. `confirmation_last_attempt_at` is set inside the claiming UPDATE
  -- below, atomically, which makes it the honest measure of committed spend.
  --
  -- A row still counts for `retry_after` after a failed attempt, so a
  -- permanently broken address holds a slot briefly. That is the direction to
  -- err in: overshooting the provider's limit costs deliverability for
  -- everyone, undershooting costs one confirmation a quarter of an hour.
  select count(*) into spent
  from public.waitlist
  where confirmation_sent_at > now() - interval '24 hours'
     or (
       confirmation_sent_at is null
       and confirmation_last_attempt_at > now() - retry_after
     );

  budget := least(batch_size, daily_cap - spent);

  if budget <= 0 then
    return;
  end if;

  return query
  with claimed as (
    select w.id
    from public.waitlist w
    where w.confirmation_sent_at is null
      and w.confirmation_attempts < max_attempts
      and (
        w.confirmation_last_attempt_at is null
        or w.confirmation_last_attempt_at < now() - retry_after
      )
    order by w.created_at
    limit budget
    for update skip locked
  )
  update public.waitlist w
  set confirmation_attempts = w.confirmation_attempts + 1,
      confirmation_last_attempt_at = now()
  from claimed c
  where w.id = c.id
  returning w.id, w.email;
end;
$$;

-- This function returns email addresses, and PostgREST exposes every function
-- in `public` as an RPC endpoint. Only the service role may call it.
revoke all on function public.claim_waitlist_confirmations(integer, integer, integer, interval)
  from public, anon, authenticated;
grant execute on function public.claim_waitlist_confirmations(integer, integer, integer, interval)
  to service_role;
