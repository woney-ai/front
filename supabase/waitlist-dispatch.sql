-- Woney waitlist — how the confirmation mailer gets invoked.
--
-- Run this once in the Supabase SQL editor, AFTER waitlist-confirmation.sql
-- and after the `send-waitlist-confirmation` edge function is deployed.
--
-- Two triggers, one function, on purpose:
--
--   * An INSERT trigger fires the mailer immediately, so a confirmation
--     normally lands within seconds of the signup.
--   * A cron job sweeps every fifteen minutes for anything the immediate
--     attempt failed to deliver — a provider outage, a 429 from a burst of
--     simultaneous signups, or a daily cap that has since reset.
--
-- The sweep is not the delivery path. It is the reason a failed send is a
-- delay rather than a silent loss, which is the failure mode that matters:
-- the signup succeeds either way, so nobody finds out the email never
-- arrived until weeks later.
--
-- Both paths call the same function, and the claim in
-- waitlist-confirmation.sql (`for update skip locked` plus a lease on
-- confirmation_last_attempt_at) is what lets them overlap without mailing
-- the same address twice.
--
-- Replace the placeholder below with the project's SECRET key
-- (Project Settings -> API Keys -> `sb_secret_...`, or the legacy
-- `service_role` key). It is stored encrypted in Vault, never in this repo.

-- Both extensions create and own their own schemas (`cron` and `net`), so
-- neither takes a `with schema` clause. You can also enable them from
-- Database -> Extensions in the dashboard.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store the key, creating it the first time and replacing it on every run
-- after that.
--
-- The obvious version of this — `create_secret ... where not exists` — is a
-- trap. Once the secret exists, a re-run skips the write silently, so a file
-- executed the first time with the placeholder still in it can never be
-- corrected by editing the placeholder and running it again. The guard below
-- fails loudly in that case instead, which is the only failure worth having:
-- a wrong key here surfaces as a 401 from the edge function, with nothing in
-- the database to suggest why.
do $$
declare
  v_key text := 'PASTE_YOUR_SECRET_KEY_HERE';
  v_id  uuid;
begin
  if v_key = 'PASTE_YOUR_SECRET_KEY_HERE' then
    raise exception
      'Replace PASTE_YOUR_SECRET_KEY_HERE with the project secret key before running this file.';
  end if;

  select id into v_id from vault.secrets where name = 'waitlist_mailer_key';

  if v_id is null then
    perform vault.create_secret(
      v_key,
      'waitlist_mailer_key',
      'Invokes the send-waitlist-confirmation edge function'
    );
  else
    perform vault.update_secret(v_id, v_key);
  end if;
end;
$$;

-- Every dispatch is recorded here so its outcome can be looked up afterwards.
-- `net.http_post` returns a request id and nothing else — the response lands
-- later in `net._http_response`, asynchronously, with no way back into the
-- calling transaction. Without this row there is no key to join on, which is
-- how an undeployed function stayed invisible: the POST 404'd every time and
-- the database had no record that it had ever asked.
create table if not exists public.waitlist_mailer_dispatch (
  request_id bigint primary key,
  created_at timestamptz not null default now()
);

alter table public.waitlist_mailer_dispatch enable row level security;

revoke all on table public.waitlist_mailer_dispatch from public, anon, authenticated;

-- Invokes the edge function. `net.http_post` only enqueues the request, so
-- this never blocks the caller, and the enqueued row is part of the calling
-- transaction — a rolled back signup sends nothing.
create or replace function public.invoke_waitlist_mailer()
returns void
language plpgsql
-- security definer because the caller may be `anon`, which cannot read Vault.
-- The body takes no arguments and interpolates nothing, so it has no
-- injection surface; search_path is pinned regardless.
security definer
set search_path = public, extensions
as $$
declare
  v_request_id bigint;
begin
  -- Nothing to do, so do nothing. Both callers arrive here — the insert
  -- trigger, where the new row is already visible and this passes, and the
  -- fifteen-minute sweep, which is the one that spends most of its life
  -- waking an edge function up to be told the queue is empty.
  --
  -- The 5 mirrors `max_attempts` in claim_waitlist_confirmations(), and it is
  -- written in three places, not two: here, and twice more in
  -- check_waitlist_mailer_health() below — the stalled count and the abandoned
  -- count. Raise max_attempts and miss any one of them and the mismatch is
  -- silent: this guard stops dispatching rows the claim would still hand out,
  -- and the health check reports rows as abandoned while they are still being
  -- retried.
  --
  -- This does narrow observability: an empty queue no longer produces a
  -- dispatch to inspect, so a broken function goes unnoticed until the next
  -- real signup. That is the moment it starts mattering, and the health
  -- check's stalled-signup branch catches it from the other side.
  if not exists (
    select 1
    from public.waitlist
    where confirmation_sent_at is null
      and not public.waitlist_delivery_is_terminal(delivery_status)
      and confirmation_attempts < 5
  ) then
    return;
  end if;

  select net.http_post(
    url := 'https://ymrqdnaiclanibgpujot.supabase.co/functions/v1/send-waitlist-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'waitlist_mailer_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into v_request_id;

  insert into public.waitlist_mailer_dispatch (request_id)
  values (v_request_id);
end;
$$;

-- PostgREST exposes every function in `public` as an RPC. This one is
-- security definer, so leaving it callable would let anyone on the internet
-- spam the mailer.
revoke all on function public.invoke_waitlist_mailer() from public, anon, authenticated;

-- The exception block is the whole point of this wrapper.
--
-- An `after insert` trigger runs inside the inserting statement, so an error
-- raised here aborts the signup itself: the visitor gets a failed form because
-- something went wrong on the way to sending an email. That trade is never
-- worth it. A signup we captured but did not confirm is recoverable — the
-- sweep retries it. A signup we refused is gone.
--
-- This does not swallow Resend outages; `net.http_post` merely enqueues and
-- would not have raised anyway. It catches the enqueue path itself failing —
-- pg_net missing, Vault unreadable, the dispatch insert conflicting.
create or replace function public.on_waitlist_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.invoke_waitlist_mailer();
  exception
    when others then
      -- Postgres logs, visible under Supabase Logs. The row stays unsent with
      -- confirmation_attempts still 0, so the sweep picks it up regardless.
      raise warning 'waitlist mailer dispatch failed: % (%)', sqlerrm, sqlstate;
  end;

  return null;
end;
$$;

revoke all on function public.on_waitlist_insert() from public, anon, authenticated;

drop trigger if exists waitlist_send_confirmation on public.waitlist;

-- `after insert` so the row is committed-visible to the function that will
-- claim it. Statement level, not row level: one signup or fifty, the mailer
-- only needs to be told once that there is work.
create trigger waitlist_send_confirmation
  after insert on public.waitlist
  for each statement
  execute function public.on_waitlist_insert();

-- The sweeper. Idempotent: drop the old schedule before creating it, so
-- editing the cadence is a matter of re-running this file.
select cron.unschedule('sweep-waitlist-confirmations')
where exists (
  select 1 from cron.job where jobname = 'sweep-waitlist-confirmations'
);

-- The function is a no-op when nothing is pending, and the daily cap lives in
-- the database, so this cadence only controls how quickly a backlog drains —
-- never how much gets sent.
select cron.schedule(
  'sweep-waitlist-confirmations',
  '*/15 * * * *',
  $$select public.invoke_waitlist_mailer()$$
);

-- Turns a silent failure into a loud one.
--
-- Everything above is fire-and-forget: the trigger cannot see the HTTP result,
-- and a request that never reaches the function never increments
-- `confirmation_attempts`. So a broken deploy looks exactly like an idle queue
-- — which is precisely how this pipeline sat dead with a real signup waiting
-- in it. The check below is the one component that reads the outcome back and
-- says so out loud.
create or replace function public.check_waitlist_mailer_health()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_failed     integer;
  v_stalled    integer;
  v_abandoned  integer;
  v_unresolved integer;
  v_bounced    integer;
  v_resolved   integer;
  v_detail     text;
begin
  -- pg_net prunes `_http_response` after a few hours, so anything older than
  -- that can no longer be judged. Drop it rather than keep unjoinable rows.
  delete from public.waitlist_mailer_dispatch
  where created_at < now() - interval '1 day';

  -- The rate limit only ever looks back an hour, so a day is already
  -- generous. Left alone this table grows for the lifetime of the site.
  delete from public.waitlist_signup_attempt
  where created_at < now() - interval '1 day';

  select count(*), min(coalesce(r.error_msg, 'HTTP ' || r.status_code))
  into v_failed, v_detail
  from public.waitlist_mailer_dispatch d
  join net._http_response r on r.id = d.request_id
  where d.created_at > now() - interval '1 hour'
    and (r.status_code is null or r.status_code >= 300);

  if v_failed > 0 then
    raise warning
      'waitlist mailer: % failed dispatch(es) in the last hour, e.g. %',
      v_failed, v_detail;
  end if;

  -- A row still unsent well past two sweeps means delivery is not recovering
  -- on its own, whatever the HTTP layer reported.
  select count(*)
  into v_stalled
  from public.waitlist
  where confirmation_sent_at is null
    and not public.waitlist_delivery_is_terminal(delivery_status)
    and confirmation_attempts < 5
    and created_at < now() - interval '45 minutes';

  if v_stalled > 0 then
    raise warning
      'waitlist mailer: % signup(s) unconfirmed for over 45 minutes',
      v_stalled;
  end if;

  -- The warning above has a hole exactly where it matters most. It counts rows
  -- with attempts under the limit, so during a total outage it fires for half
  -- an hour and then falls silent — every affected row crosses five attempts
  -- and drops out of the count. Silence would then mean "recovered" and
  -- "nobody is getting mail" at the same time.
  --
  -- Abandonment is the louder signal, not the quieter one. A revoked Resend
  -- key or a suspended account produces exactly this and produces it forever,
  -- and no other check sees it: the send loop catches each failure per row and
  -- still answers 200, so the dispatch-level check finds nothing wrong either.
  select count(*)
  into v_abandoned
  from public.waitlist
  where confirmation_sent_at is null
    and not public.waitlist_delivery_is_terminal(delivery_status)
    and confirmation_attempts >= 5;

  if v_abandoned > 0 then
    raise warning
      'waitlist mailer: % signup(s) abandoned after 5 failed attempts and will never be retried',
      v_abandoned;
  end if;

  -- Bounces are the one failure the send path cannot see: Resend accepts the
  -- message, the receiving server rejects it later, and nothing says so. The
  -- reconciler in waitlist-delivery.sql writes the answer here; this reads it.
  -- Ten per cent sustained is where mailbox providers start treating a domain
  -- as careless, and a small list crosses that on a handful of typos.
  -- A reconciler that always fails looks exactly like one with no work: rows
  -- keep a null delivery_status and nothing complains. That is how a
  -- Sending-only API key went unnoticed until someone read the counters by
  -- hand.
  --
  -- Twelve hours is twice the reconciler's six-hour cadence, and the pairing
  -- is the whole point. A message sent just after a run legitimately waits
  -- nearly six hours for its first poll, so a tighter threshold would fire
  -- during normal operation — and an alarm that goes off when nothing is
  -- wrong is worse than no alarm, because it teaches you to ignore the one
  -- that matters. Change the schedule in waitlist-delivery.sql and change
  -- this with it.
  -- Note what is NOT required here: a provider message id. A send whose
  -- response body could not be parsed stores a null id, and such a row is
  -- invisible to the reconciler, which only claims rows that have one. Asking
  -- for an id would have made this alarm blind to precisely the rows nothing
  -- else can see.
  select count(*)
  into v_unresolved
  from public.waitlist
  where confirmation_sent_at is not null
    and delivery_status is null
    and confirmation_sent_at < now() - interval '12 hours';

  if v_unresolved > 0 then
    raise warning
      'waitlist mailer: % message(s) sent over 12 hours ago with no delivery status — is the reconciler failing?',
      v_unresolved;
  end if;

  select
    count(*) filter (where delivery_status = 'bounced'),
    count(*)
  into v_bounced, v_resolved
  from public.waitlist
  where confirmation_sent_at > now() - interval '7 days'
    and public.waitlist_delivery_is_terminal(delivery_status);

  if v_resolved >= 20 and v_bounced * 10 > v_resolved then
    raise warning
      'waitlist mailer: % of % delivered messages bounced in the last 7 days',
      v_bounced, v_resolved;
  end if;
end;
$$;

revoke all on function public.check_waitlist_mailer_health() from public, anon, authenticated;

select cron.unschedule('check-waitlist-mailer-health')
where exists (
  select 1 from cron.job where jobname = 'check-waitlist-mailer-health'
);

select cron.schedule(
  'check-waitlist-mailer-health',
  '0 * * * *',
  $$select public.check_waitlist_mailer_health()$$
);

-- Useful afterwards:
--
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from net._http_response order by created desc limit 10;
--
--   -- queue health. `pending` should normally be 0; a number that stays
--   -- above 0 between sweeps means the immediate send is failing.
--   select
--     count(*) filter (where confirmation_sent_at is not null) as sent,
--     count(*) filter (where confirmation_sent_at is null
--                        and confirmation_attempts < 5)        as pending,
--     count(*) filter (where confirmation_sent_at is null
--                        and confirmation_attempts >= 5)       as abandoned
--   from public.waitlist;
