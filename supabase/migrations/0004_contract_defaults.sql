-- RealOffer AI — contract defaults (category-based, starts with Due Diligence)
-- Run this once in the Supabase SQL Editor against your project, after
-- 0003_buyer_profiles.sql. Safe to re-run: every statement is guarded.

-- ---------------------------------------------------------------------------
-- contract_defaults: one row per (user, category) of saved contract-builder
-- preferences. `values` is an opaque JSONB blob validated by a zod schema in
-- application code (see lib/contractDefaults/schema.ts) — the same pattern
-- already used for contracts.form_data (see 0002_contracts.sql) rather than
-- typed columns, so adding a future category (closing, financing, earnest
-- money, assignment) is a new category string + a new app-side schema, with
-- no migration required. This milestone only ever writes
-- category = 'due_diligence'.
-- ---------------------------------------------------------------------------
create table if not exists public.contract_defaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One row per user per category — this is what makes a plain
  -- `.upsert(..., { onConflict: 'user_id,category' })` work from the client
  -- and is what prevents duplicate default records for the same user.
  unique (user_id, category)
);

create index if not exists contract_defaults_user_id_idx on public.contract_defaults(user_id);

alter table public.contract_defaults enable row level security;

drop policy if exists "own contract defaults" on public.contract_defaults;
create policy "own contract defaults" on public.contract_defaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_contract_defaults_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contract_defaults_set_updated_at on public.contract_defaults;
create trigger contract_defaults_set_updated_at
  before update on public.contract_defaults
  for each row execute function public.set_contract_defaults_updated_at();
