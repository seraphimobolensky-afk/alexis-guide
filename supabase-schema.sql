-- Run this in your Supabase project's SQL editor

-- Deprecated as of Phase 7 — replaced by habits/habit_entries below.
-- The table is left in place (so no data is destroyed) but the app no
-- longer reads from or writes to it.
create table if not exists checklist_completions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  section     text not null,
  item_key    text not null,
  completed   boolean default false,
  completed_at timestamptz,
  created_at  timestamptz default now(),
  unique(user_id, section, item_key)
);

-- Row Level Security: users can only see and edit their own rows
alter table checklist_completions enable row level security;

drop policy if exists "Users manage their own completions" on checklist_completions;
create policy "Users manage their own completions"
  on checklist_completions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Phase 7: habit tracking + grocery list ──────────────────────────────────

-- Habits are per-user rows (not a shared global list) — the app seeds the
-- 11 cleaning tasks from lib/content.ts into this table automatically the
-- first time a user visits the cleaning page, using their existing `key`
-- values, so this SQL doesn't need to know anyone's user id up front.
--
-- Note: `cadence` isn't in the field list the phase spec gave — it's an
-- addition. Without it there'd be no way to know which "done within
-- window" rule (weekly / bi-weekly / monthly / as-needed) applies to a
-- given habit, and the whole point of this table is to support that.
create table if not exists habits (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  key         text not null,
  label       text not null,
  icon        text,
  value_type  text not null default 'boolean' check (value_type in ('boolean', 'number', 'percent')),
  unit        text,
  target      numeric,
  cadence     text not null default 'weekly' check (cadence in ('weekly', 'biweekly', 'monthly', 'as_needed')),
  "group"     text not null default 'custom' check ("group" in ('cleaning', 'custom')),
  sort_order  integer not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz default now(),
  unique(user_id, key)
);

alter table habits enable row level security;

drop policy if exists "Users manage their own habits" on habits;
create policy "Users manage their own habits"
  on habits
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists habits_user_group_idx on habits(user_id, "group");

-- One row per day a habit was logged. Unique on (habit_id, entry_date) so
-- correcting a mistake means updating or deleting that day's row, not
-- accumulating duplicates.
create table if not exists habit_entries (
  id          uuid default gen_random_uuid() primary key,
  habit_id    uuid references habits(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  entry_date  date not null,
  value_bool  boolean,
  value_num   numeric,
  value_pct   numeric,
  created_at  timestamptz default now(),
  unique(habit_id, entry_date)
);

alter table habit_entries enable row level security;

drop policy if exists "Users manage their own habit entries" on habit_entries;
create policy "Users manage their own habit entries"
  on habit_entries
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists habit_entries_user_date_idx on habit_entries(user_id, entry_date);

create table if not exists grocery_items (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  category      text,
  quantity      text,
  purchased     boolean not null default false,
  purchased_at  timestamptz,
  created_at    timestamptz default now()
);

alter table grocery_items enable row level security;

drop policy if exists "Users manage their own grocery items" on grocery_items;
create policy "Users manage their own grocery items"
  on grocery_items
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists grocery_items_user_purchased_idx on grocery_items(user_id, purchased);

-- ─── Table privileges ────────────────────────────────────────────────────────
-- RLS policies only filter rows; the role still needs table-level privileges
-- to touch the table at all. This Supabase project doesn't grant them
-- automatically for tables created in the SQL editor, so without these every
-- query from a signed-in user fails with "permission denied" (42501).
-- Only `authenticated` is granted — the app never queries these signed out.
grant select, insert, update, delete on habits        to authenticated;
grant select, insert, update, delete on habit_entries to authenticated;
grant select, insert, update, delete on grocery_items to authenticated;
