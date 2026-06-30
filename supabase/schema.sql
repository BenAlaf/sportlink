-- SportLink database schema (M5).
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- Every table is protected by Row-Level Security so each user only ever sees
-- and edits their own rows.

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Athlete',
  fitness_level text not null default 'intermediate',
  preferred_sports text[] not null default '{}',
  goal text not null default '',
  weekly_target int not null default 4,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── Saved routes ────────────────────────────────────────────────────────────
create table if not exists public.saved_routes (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  route jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.saved_routes enable row level security;

create policy "saved_routes: own rows" on public.saved_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Saved courts ────────────────────────────────────────────────────────────
-- Court data itself is bundled in the app; we only store which courts a user saved.
create table if not exists public.saved_courts (
  user_id uuid not null references auth.users (id) on delete cascade,
  court_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, court_id)
);

alter table public.saved_courts enable row level security;

create policy "saved_courts: own rows" on public.saved_courts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
