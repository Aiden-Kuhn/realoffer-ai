-- RealOffer AI — dedicated Buyer Profile table
-- Run this once in the Supabase SQL Editor against your project, after
-- 0002_contracts.sql. Safe to re-run: every statement is guarded.

-- ---------------------------------------------------------------------------
-- buyer_profiles: identity/contact details a user saves once and reuses to
-- prefill every future contract's Buyer section. Deliberately a separate
-- table from user_settings (which is a grab-bag of unrelated app
-- preferences) so this can grow into multiple buyer identities (personal
-- name, one LLC, another LLC) later without a data reshape — see the
-- `unique (user_id)` comment below for exactly what that migration path
-- looks like.
--
-- No auto-provisioning trigger here (unlike user_settings): a missing row
-- is the correct, meaningful "first-time user, no profile saved yet" state
-- that the app relies on to show its own onboarding message.
-- ---------------------------------------------------------------------------
create table if not exists public.buyer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Always true today (exactly one profile per user). Present so a future
  -- multiple-profiles milestone can add non-default rows without a schema
  -- change — see the unique constraint note below.
  is_default boolean not null default true,
  legal_name text not null default '',
  entity_name text not null default '',
  mailing_address_line1 text not null default '',
  mailing_city text not null default '',
  mailing_state text not null default '',
  mailing_zip text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One default profile per user for this milestone — this is what makes a
  -- plain `.upsert(..., { onConflict: 'user_id' })` work from the client.
  -- To support multiple profiles later: drop this constraint, add a partial
  -- unique index `on buyer_profiles(user_id) where is_default`, and build a
  -- list UI. No data migration needed — every existing row already has
  -- is_default = true.
  unique (user_id)
);

create index if not exists buyer_profiles_user_id_idx on public.buyer_profiles(user_id);

alter table public.buyer_profiles enable row level security;

drop policy if exists "own buyer profile" on public.buyer_profiles;
create policy "own buyer profile" on public.buyer_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_buyer_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists buyer_profiles_set_updated_at on public.buyer_profiles;
create trigger buyer_profiles_set_updated_at
  before update on public.buyer_profiles
  for each row execute function public.set_buyer_profiles_updated_at();
