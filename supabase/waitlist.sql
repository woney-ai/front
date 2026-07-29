-- Woney waitlist storage.
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  referrer text,
  created_at timestamptz not null default now()
);

-- One row per address. The client relies on error code 23505 to detect
-- an address that already signed up.
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- The browser uses a publishable key, which resolves to the `anon` role,
-- so it may only INSERT. No select/update/delete policy exists, which means
-- the list is not readable from the client. Read it from the dashboard or
-- with a secret key server-side.
drop policy if exists "anon can join waitlist" on public.waitlist;

create policy "anon can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (
    email is not null
    and char_length(email) between 3 and 254
    and email like '%_@_%.__%'
    -- The shape check above accepts characters that stop being harmless once
    -- this value is handed to a mail provider. `_` and `%` match anything,
    -- including a comma, so `victim@a.com,attacker@b.com` passes it — and the
    -- mailer puts that string straight into Resend's recipient field. The
    -- browser's own validation forbids these, but the browser is not the gate:
    -- anything can post here with the key from the bundle.
    and email !~ '[[:space:],;<>"\\]'
    -- Exactly one @. Two of them make the address ambiguous to every reader
    -- that splits on it — including the mailer's own domain check, which took
    -- the second segment and so would have looked up `a.com` for
    -- `victim@a.com@attacker.net` while the message went elsewhere.
    and (char_length(email) - char_length(replace(email, '@', ''))) = 1
  );
