-- RealOffer AI — property-based contract generator schema
-- Run this once in the Supabase SQL Editor against your project, after
-- 0001_init.sql. Safe to re-run: every statement is guarded.

-- ---------------------------------------------------------------------------
-- user_settings: add buyer mailing address + phone, so "buyer information
-- saved in the user profile" (name, company, email, address, phone) is
-- actually storable. Email already comes from auth.users — not duplicated
-- here.
-- ---------------------------------------------------------------------------
alter table public.user_settings
  add column if not exists mailing_address_line1 text not null default '',
  add column if not exists mailing_city text not null default '',
  add column if not exists mailing_state text not null default '',
  add column if not exists mailing_zip text not null default '',
  add column if not exists phone text not null default '';

-- ---------------------------------------------------------------------------
-- contracts: one row per contract draft, always tied to the deal (and thus
-- the property) it was created from. There is no separate `properties`
-- table in this app — a property only exists embedded inside its deal row
-- — so `deal_id` is the single link covering both "property" and
-- "deal/analysis" from the spec.
-- ---------------------------------------------------------------------------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  template_id text not null,
  template_version text not null,
  -- Two-letter state code, or null until the user selects one. Selecting a
  -- state never changes which template renders in this milestone — only
  -- the general template exists — it only changes the disclaimer shown.
  jurisdiction_state text,
  status text not null default 'draft'
    check (status in ('draft', 'ready_for_review', 'exported', 'archived')),
  -- Structured builder data for sections A-F. Validated by the template's
  -- zod schema in application code, not by a DB constraint (schema can
  -- evolve per template_version without a migration).
  form_data jsonb not null default '{}'::jsonb,
  -- Frozen, fully-resolved document data captured at the moment of export,
  -- so re-downloading the PDF later always matches what was reviewed even
  -- if form_data (or the live template) changes afterward. Null until the
  -- first export.
  document_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_user_id_idx on public.contracts(user_id);
create index if not exists contracts_deal_id_idx on public.contracts(deal_id);
create index if not exists contracts_user_id_updated_at_idx on public.contracts(user_id, updated_at desc);

alter table public.contracts enable row level security;

drop policy if exists "select own contracts" on public.contracts;
create policy "select own contracts" on public.contracts
  for select using (auth.uid() = user_id);

-- The deal_id subquery is the important part here: without it, a user
-- could point deal_id at a deal they don't own (user_id alone only proves
-- they own the *contract* row, not that they own the deal it references).
drop policy if exists "insert own contracts" on public.contracts;
create policy "insert own contracts" on public.contracts
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.deals d where d.id = deal_id and d.user_id = auth.uid())
  );

drop policy if exists "update own contracts" on public.contracts;
create policy "update own contracts" on public.contracts
  for update using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from public.deals d where d.id = deal_id and d.user_id = auth.uid())
  );

drop policy if exists "delete own contracts" on public.contracts;
create policy "delete own contracts" on public.contracts
  for delete using (auth.uid() = user_id);

create or replace function public.set_contracts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_contracts_updated_at();
