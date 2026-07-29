-- Throttles the public signup endpoint.
--
-- The insert policy is open to `anon` by necessity: the form posts straight to
-- PostgREST with a key that ships in the bundle. Before confirmation emails
-- existed that was cheap to abuse and boring — a scripted flood wrote junk
-- rows and nothing else happened. It is not boring any more. Every insert now
-- costs a real send against a 95/day budget, so a few minutes of scripted
-- traffic starves the day's genuine signups and points a wave of bounces at
-- the reputation of a domain we have to talk to customers from.
--
-- Two layers, because the two harms have different shapes:
--
--   Here — a per-address limit, which stops the naive script at the door.
--   In waitlist-confirmation.sql — a delivery breaker, which stops an
--   unusual hour from reaching the mail provider at all.
--
-- Neither stops a determined attacker rotating addresses. That takes a proof
-- of work the browser must solve — Turnstile or hCaptcha in front of the
-- insert — and that is worth doing the day this link gets real attention.
-- Read this as raising the cost, not closing the door.

create table if not exists public.waitlist_signup_attempt (
  id bigserial primary key,
  fingerprint text not null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_signup_attempt_lookup
  on public.waitlist_signup_attempt (fingerprint, created_at desc);

alter table public.waitlist_signup_attempt enable row level security;

revoke all on table public.waitlist_signup_attempt from public, anon, authenticated;

create or replace function public.enforce_waitlist_rate_limit()
returns trigger
language plpgsql
-- security definer: `anon` has no rights on the attempt table and must not.
security definer
set search_path = public
as $$
declare
  v_fingerprint text;
  v_recent      integer;
begin
  -- PostgREST publishes the request headers as a GUC. Behind Supabase's proxy
  -- the caller's address is the FIRST entry of x-forwarded-for; everything
  -- after it is our own infrastructure and proves nothing.
  v_fingerprint := nullif(
    btrim(
      split_part(
        coalesce(
          current_setting('request.headers', true)::json ->> 'x-forwarded-for',
          ''
        ),
        ',',
        1
      )
    ),
    ''
  );

  -- No header means this did not arrive over HTTP: a dashboard query, psql, a
  -- migration. Those callers are already trusted, and throttling them would
  -- put every seed script on one shared budget.
  if v_fingerprint is null then
    return new;
  end if;

  select count(*) into v_recent
  from public.waitlist_signup_attempt
  where fingerprint = v_fingerprint
    and created_at > now() - interval '1 hour';

  -- Five is far above what one honest person does and far below what makes a
  -- flood worth writing. PostgREST turns the PT429 SQLSTATE into HTTP 429, so
  -- the client can tell this apart from a genuine failure and say something
  -- true instead of "please try again".
  if v_recent >= 5 then
    raise exception 'Too many signups from this address. Try again later.'
      using errcode = 'PT429';
  end if;

  insert into public.waitlist_signup_attempt (fingerprint)
  values (v_fingerprint);

  return new;
end;
$$;

revoke all on function public.enforce_waitlist_rate_limit() from public, anon, authenticated;

drop trigger if exists waitlist_rate_limit on public.waitlist;

-- `before insert`, so a rejected attempt never becomes a row and never
-- reaches the confirmation queue.
create trigger waitlist_rate_limit
  before insert on public.waitlist
  for each row
  execute function public.enforce_waitlist_rate_limit();
