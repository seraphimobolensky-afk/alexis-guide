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

-- ─── Per-habit chart colour ──────────────────────────────────────────────────
-- One of the palette names in lib/habitColors.ts. Null means "use the default
-- for this habit's position in its group".
alter table habits add column if not exists color text;

-- ─── Phase 9: remembered grocery categories ──────────────────────────────────
-- When an item is moved to a different category by hand, that choice is saved
-- here against the item's normalised name, and reused the next time the same
-- item is added. Kept separate from grocery_items so clearing the "Bought"
-- history doesn't make the app forget the correction.
create table if not exists grocery_category_overrides (
  user_id     uuid references auth.users(id) on delete cascade not null,
  term        text not null,
  category    text not null,
  updated_at  timestamptz default now(),
  primary key (user_id, term)
);

alter table grocery_category_overrides enable row level security;

drop policy if exists "Users manage their own grocery overrides" on grocery_category_overrides;
create policy "Users manage their own grocery overrides"
  on grocery_category_overrides
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on grocery_category_overrides to authenticated;

-- ─── Meal planner ────────────────────────────────────────────────────────────
-- How the grocery link works:
-- A meal's ingredients can be sent to the grocery list. Each meal_ingredients
-- row that does so points at one grocery_items row (grocery_item_id), and
-- several ingredients can point at the same grocery row ("eggs" for two
-- meals). A grocery row's displayed `quantity` is never edited directly by
-- the planner: it is always recomputed as `base_quantity` (what Alexis typed
-- himself) plus the quantities of every meal_ingredients row linked to it,
-- joined with " + " and skipping blanks (e.g. "6 + 2 + 3"). Removing a meal
-- or ingredient therefore takes its quantity back off again. A planner-made
-- row (origin = 'planner') with no links left is deleted, as long as it
-- hasn't been bought; a manual row is always kept.

-- One meal per user, day and slot.
create table if not exists meal_plans (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  plan_date   date not null,
  slot        text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  name        text not null,
  notes       text,
  -- The `key` of a recipe in lib/content.ts, if the meal was picked from one.
  recipe_key  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, plan_date, slot)
);

alter table meal_plans enable row level security;

drop policy if exists "Users manage their own meal plans" on meal_plans;
create policy "Users manage their own meal plans"
  on meal_plans
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists meal_plans_user_date_idx on meal_plans(user_id, plan_date);

create table if not exists meal_ingredients (
  id                uuid default gen_random_uuid() primary key,
  meal_id           uuid references meal_plans(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  name              text not null,
  quantity          text,
  add_to_groceries  boolean not null default true,
  grocery_item_id   uuid references grocery_items(id) on delete set null,
  sort_order        integer not null default 0,
  created_at        timestamptz default now()
);

alter table meal_ingredients enable row level security;

drop policy if exists "Users manage their own meal ingredients" on meal_ingredients;
create policy "Users manage their own meal ingredients"
  on meal_ingredients
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists meal_ingredients_meal_idx on meal_ingredients(meal_id);
create index if not exists meal_ingredients_grocery_item_idx on meal_ingredients(grocery_item_id);

-- Whether Alexis typed the item ('manual') or the planner created it ('planner').
alter table grocery_items add column if not exists origin text not null default 'manual'
  check (origin in ('manual', 'planner'));
-- The quantity Alexis typed himself, kept apart from the planner's additions.
alter table grocery_items add column if not exists base_quantity text;

-- One-off backfill: existing manual items' quantity is all his own. Rows with
-- planner links are skipped, so re-running this later can never copy a
-- combined "6 + 2" quantity into base_quantity.
update grocery_items set base_quantity = quantity
  where base_quantity is null
    and origin = 'manual'
    and not exists (select 1 from meal_ingredients mi where mi.grocery_item_id = grocery_items.id);

grant select, insert, update, delete on meal_plans       to authenticated;
grant select, insert, update, delete on meal_ingredients to authenticated;

-- ─── Your own recipes ────────────────────────────────────────────────────────
-- Recipes Alexis adds himself, shown on the recipes page next to the ones in
-- lib/content.ts and suggested in the meal planner. A meal picked from one
-- stores recipe_key = 'mine-<id>'; deleting the recipe leaves those meals as
-- they are (just without the "View recipe" link).
create table if not exists user_recipes (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  emoji        text not null default '🍽️',
  intro        text,
  -- [{ "name": "beef mince", "quantity": "500g" }, …] in list order.
  ingredients  jsonb not null default '[]'::jsonb,
  -- ["Brown the mince", …] in order.
  steps        jsonb not null default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table user_recipes enable row level security;

drop policy if exists "Users manage their own recipes" on user_recipes;
create policy "Users manage their own recipes"
  on user_recipes
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_recipes_user_idx on user_recipes(user_id);

grant select, insert, update, delete on user_recipes to authenticated;
