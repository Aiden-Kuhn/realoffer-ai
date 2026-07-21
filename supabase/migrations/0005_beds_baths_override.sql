-- Adds user-correctable bedroom/bathroom overrides to a saved deal.
-- Kept as separate nullable columns, fully independent of the `property`
-- JSONB blob (the raw RentCast/demo provider record is never mutated).
-- RLS is enforced at the row level on `deals` (see 0001_init.sql) — Postgres
-- has no column-level RLS, so the existing select/insert/update/delete
-- policies on `deals` already cover these two new columns with no changes.

alter table public.deals
  add column if not exists bedrooms_override integer,
  add column if not exists bathrooms_override numeric(4,1);
