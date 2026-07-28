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

-- The browser uses the anon key, so it may only INSERT.
-- No select/update/delete policy exists, which means the list is not
-- readable from the client. Read it from the dashboard or a service role.
drop policy if exists "anon can join waitlist" on public.waitlist;

create policy "anon can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (
    email is not null
    and char_length(email) between 3 and 254
    and email like '%_@_%.__%'
  );
