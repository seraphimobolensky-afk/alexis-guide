-- Run this in your Supabase project's SQL editor

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

create policy "Users manage their own completions"
  on checklist_completions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
