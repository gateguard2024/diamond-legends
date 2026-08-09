-- ===========================================================================
-- Diamond Legends — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and hit Run.
-- ===========================================================================

-- --------------------------------------------------------------------------
-- SESSIONS
-- --------------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  player_id   text        not null,
  date        date        not null,
  pitching    jsonb,
  fielding    jsonb,
  hitting     jsonb,
  notes       text,
  xp_earned   integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists sessions_player_date_idx
  on public.sessions (player_id, date desc);

-- --------------------------------------------------------------------------
-- GOALS
--   One active row per (player_id, metric) — active means achieved_at is null.
--   Achieved goals stay in the table as the player's goal history.
-- --------------------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  player_id      text        not null,
  metric         text        not null,
  target         numeric     not null,
  start_value    numeric     not null default 0,
  created_at     timestamptz not null default now(),
  achieved_at    timestamptz,
  achieved_value numeric
);

create index if not exists goals_player_metric_idx
  on public.goals (player_id, metric);

-- Only one goal per metric may be active at a time.
create unique index if not exists goals_one_active_per_metric
  on public.goals (player_id, metric)
  where achieved_at is null;

-- --------------------------------------------------------------------------
-- PLAYER PROFILES
--   The editable bits of a player card: jersey number and slogan.
--   Names, colors and division live in lib/players.ts.
-- --------------------------------------------------------------------------
create table if not exists public.player_profiles (
  player_id  text primary key,
  number     integer     not null default 0,
  slogan     text        not null default '',
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- This is a private family app with no login, so the anon key is allowed to
-- read and write both tables. Anyone who knows your project URL + anon key
-- could do the same, so do not publish those keys anywhere public.
-- If you later want a login, replace `true` with `auth.uid() is not null`
-- and turn on Supabase Auth.
-- --------------------------------------------------------------------------
alter table public.sessions        enable row level security;
alter table public.goals           enable row level security;
alter table public.player_profiles enable row level security;

drop policy if exists "family full access" on public.sessions;
create policy "family full access" on public.sessions
  for all using (true) with check (true);

drop policy if exists "family full access" on public.goals;
create policy "family full access" on public.goals
  for all using (true) with check (true);

drop policy if exists "family full access" on public.player_profiles;
create policy "family full access" on public.player_profiles
  for all using (true) with check (true);
