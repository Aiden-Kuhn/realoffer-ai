-- RealOffer AI — cloud auth + cloud storage schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push` if
-- you use the CLI) against your project. Safe to re-run: every statement
-- is guarded with `if not exists` / `or replace` / `drop ... if exists`.

-- ---------------------------------------------------------------------------
-- deals: one row per saved deal analysis, owned by exactly one user.
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft',
  notes text not null default '',
  is_sample boolean not null default false,
  data_mode text not null default 'demo',
  property jsonb not null,
  comparables jsonb not null default '[]'::jsonb,
  assumptions jsonb not null,
  repair_estimate jsonb not null,
  results jsonb not null,
  investment_analysis jsonb
);

create index if not exists deals_user_id_idx on public.deals(user_id);
create index if not exists deals_user_id_created_at_idx on public.deals(user_id, created_at desc);

alter table public.deals enable row level security;

drop policy if exists "select own deals" on public.deals;
create policy "select own deals" on public.deals
  for select using (auth.uid() = user_id);

drop policy if exists "insert own deals" on public.deals;
create policy "insert own deals" on public.deals
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own deals" on public.deals;
create policy "update own deals" on public.deals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own deals" on public.deals;
create policy "delete own deals" on public.deals
  for delete using (auth.uid() = user_id);

-- Keep updated_at current on every row update, so the app never has to
-- remember to set it manually.
create or replace function public.set_deals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_deals_updated_at();

-- ---------------------------------------------------------------------------
-- user_settings: exactly one row per user (profile + default assumptions).
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company_name text not null default '',
  default_assignment_fee_cents integer not null default 1000000,
  default_investor_arv_percentage numeric not null default 0.7,
  default_holding_period_months integer not null default 4,
  default_buyer_closing_cost_percentage numeric not null default 0.02,
  default_selling_cost_percentage numeric not null default 0.08,
  default_financing_cost_percentage numeric not null default 0.02,
  currency text not null default 'USD',
  density text not null default 'comfortable'
);

alter table public.user_settings enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-provision a default settings row the moment a user signs up, so the
-- app never has to special-case "no settings row yet" on first login.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
