-- Reconciles what we sent against what actually arrived.
--
-- `confirmation_sent_at` records that Resend accepted a message. Whether it
-- reached a human is decided later, by the receiving server, and nothing tells
-- us. So the table can say a hundred confirmations went out while a quarter of
-- them bounced, and be entirely truthful about it.
--
-- That gap costs nothing today and everything on launch day, which is the one
-- send that has to land: mailing an address book of unknown quality in a
-- single burst is how a young domain teaches Gmail to distrust it, at the
-- exact moment it can least afford to.
--
-- Polling, not a webhook. A webhook buys latency nobody here consumes — no one
-- acts on a bounce in real time — and costs a public endpoint, signature
-- verification, and another surface to defend. This reuses the shape already
-- in the file next door: claim under a lease, drive it from cron, read the
-- result in the health check.
--
-- Run this after waitlist-confirmation.sql and waitlist-dispatch.sql.

alter table public.waitlist
  add column if not exists provider_message_id text,
  add column if not exists delivery_status text,
  add column if not exists delivery_checked_at timestamptz;

-- The reconciler walks rows awaiting an answer, so it reads along this order.
create index if not exists waitlist_delivery_pending
  on public.waitlist (delivery_checked_at nulls first)
  where provider_message_id is not null;

-- Once a message reaches one of these the answer cannot change, so the row
-- stops being polled. `expired` is ours: Resend prunes old messages and
-- answers 404, which is an answer, not a failure to retry forever.
create or replace function public.waitlist_delivery_is_terminal(status text)
returns boolean
language sql
immutable
as $$
  select status is not null
     and status in (
       'delivered', 'bounced', 'complained', 'canceled', 'failed', 'expired'
     );
$$;

create or replace function public.claim_waitlist_deliveries(
  batch_size integer default 40,
  recheck_after interval default interval '10 minutes',
  give_up_after interval default interval '3 days'
)
returns table (id uuid, provider_message_id text)
language plpgsql
as $$
begin
  -- Same lease as the confirmation queue: stamp the row on the way out so an
  -- overlapping run walks past it instead of asking the provider twice.
  return query
  with claimed as (
    select w.id
    from public.waitlist w
    where w.provider_message_id is not null
      and not public.waitlist_delivery_is_terminal(w.delivery_status)
      and w.confirmation_sent_at > now() - give_up_after
      and (
        w.delivery_checked_at is null
        or w.delivery_checked_at < now() - recheck_after
      )
    order by w.delivery_checked_at nulls first
    limit batch_size
    for update skip locked
  )
  update public.waitlist w
  set delivery_checked_at = now()
  from claimed c
  where w.id = c.id
  returning w.id, w.provider_message_id;
end;
$$;

revoke all on function public.claim_waitlist_deliveries(integer, interval, interval)
  from public, anon, authenticated;

grant execute on function public.claim_waitlist_deliveries(integer, interval, interval)
  to service_role;

-- Same guard as the mailer: nothing outstanding, nothing to wake.
--
-- The three-day window mirrors `give_up_after` above. Widen it there without
-- widening it here and the reconciler stops being invoked for rows the claim
-- function would still hand out.
create or replace function public.invoke_waitlist_reconciler()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_request_id bigint;
begin
  if not exists (
    select 1
    from public.waitlist
    where provider_message_id is not null
      and not public.waitlist_delivery_is_terminal(delivery_status)
      and confirmation_sent_at > now() - interval '3 days'
  ) then
    return;
  end if;

  select net.http_post(
    url := 'https://ymrqdnaiclanibgpujot.supabase.co/functions/v1/reconcile-waitlist-delivery',
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

revoke all on function public.invoke_waitlist_reconciler() from public, anon, authenticated;

select cron.unschedule('reconcile-waitlist-delivery')
where exists (
  select 1 from cron.job where jobname = 'reconcile-waitlist-delivery'
);

-- Delivery settles in seconds to minutes. Ten is unhurried on purpose: the
-- answer keeps until someone reads it.
select cron.schedule(
  'reconcile-waitlist-delivery',
  '*/10 * * * *',
  $$select public.invoke_waitlist_reconciler()$$
);

-- Useful afterwards — this is the number the list is actually worth:
--
--   select
--     count(*)                                                as captured,
--     count(*) filter (where delivery_status = 'delivered')    as delivered,
--     count(*) filter (where delivery_status = 'bounced')      as bounced,
--     count(*) filter (where delivery_status is null)          as unknown
--   from public.waitlist;
