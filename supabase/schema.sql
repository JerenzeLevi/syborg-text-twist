-- SYBORG Text Twist — global leaderboard schema
-- Run this once in the Supabase SQL Editor (Table Editor → SQL Editor → New query)

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score int not null default 0,
  words_found int not null default 0,
  mode text not null default 'classic',
  created_at timestamptz not null default now()
);

-- Re-run safe: adds the mode column to a pre-existing table (mode-filtered
-- leaderboard). No-op if the column is already there.
alter table scores add column if not exists mode text not null default 'classic';

-- club-internal, no auth: allow anon read/write scoped to what the app needs.
alter table scores enable row level security;

create policy "anyone can read scores" on scores for select using (true);
create policy "anyone can submit a score" on scores for insert with check (true);
