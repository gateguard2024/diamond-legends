-- ===========================================================================
-- Diamond Legends v2 — Elite Baseball Trainer
-- Paste into the Supabase SQL Editor and click Run. Safe to re-run.
--
-- One generic table holds everything (tests, planned slots, completions,
-- pitch counts, goals, cues, settings). It does NOT touch the v1 tables
-- (sessions, goals, player_profiles), so old data stays where it was.
-- ===========================================================================

create table if not exists public.ebt_records (
  id          uuid primary key default gen_random_uuid(),
  kind        text        not null,
  player_id   text,
  date        date        not null,
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists ebt_records_kind_player_date_idx
  on public.ebt_records (kind, player_id, date);

-- Private family app with no login: the anon key can read and write.
-- Keep the URL + anon key private. To add a login later, turn on Supabase
-- Auth and replace `true` with `auth.uid() is not null`.
alter table public.ebt_records enable row level security;

drop policy if exists "family full access" on public.ebt_records;
create policy "family full access" on public.ebt_records
  for all using (true) with check (true);
