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

-- The raw header, kept so the parsing above can be checked against reality
-- rather than trusted. Proxy chains differ per provider and the shape is not
-- worth guessing: read this column after a real signup and confirm the
-- fingerprint matches the address you expect.
alter table public.waitlist_signup_attempt
  add column if not exists forwarded_for text;

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
  v_headers     json;
  v_forwarded   text;
  v_fingerprint text;
  v_recent      integer;
begin
  -- PostgREST publishes the request headers as a GUC.
  --
  -- Which part of x-forwarded-for identifies the caller is the whole question,
  -- and the intuitive answer is wrong. Proxies APPEND the peer they saw, so
  -- the header reads `<what the client claimed>, <what hop 1 saw>, ...`. The
  -- first element is therefore supplied by the client and worth nothing: a
  -- script rotating it gets a fresh budget on every request, and the throttle
  -- is decoration.
  --
  -- So prefer the headers a trusted edge writes and a client cannot forge —
  -- Cloudflare strips and replaces cf-connecting-ip on the way in — and fall
  -- back to the LAST element, the one the closest trusted hop appended.
  v_headers := current_setting('request.headers', true)::json;

  v_forwarded := v_headers ->> 'x-forwarded-for';

  v_fingerprint := coalesce(
    v_headers ->> 'cf-connecting-ip',
    v_headers ->> 'x-real-ip',
    (
      select btrim(t.part)
      from unnest(string_to_array(coalesce(v_forwarded, ''), ','))
        with ordinality as t(part, ord)
      where btrim(t.part) <> ''
      order by t.ord desc
      limit 1
    )
  );

  v_fingerprint := nullif(btrim(coalesce(v_fingerprint, '')), '');

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

  insert into public.waitlist_signup_attempt (fingerprint, forwarded_for)
  values (v_fingerprint, v_forwarded);

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
