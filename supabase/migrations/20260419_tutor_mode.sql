-- ═══════════════════════════════════════════════════════════════
-- Migration: Tutor Mode — Messages, Checkpoints, Session Extensions
-- Run in Supabase SQL Editor AFTER the previous migration
-- ═══════════════════════════════════════════════════════════════

-- 1. Extend focus_blocks with tutor mode columns
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'focus_blocks' and column_name = 'actual_duration_minutes'
  ) then
    alter table focus_blocks add column actual_duration_minutes integer;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'focus_blocks' and column_name = 'closing_note'
  ) then
    alter table focus_blocks add column closing_note text;
  end if;
end $$;

-- 2. yleos_messages — persistent chat messages with role classification
create table if not exists yleos_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references focus_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  message_role text not null default 'scaffolding'
    check (message_role in (
      'tutor_opening','socratic_question','scaffolding',
      'feedback','micro_break','closing','student'
    )),
  created_at timestamptz not null default now()
);

create index if not exists idx_yleos_messages_session on yleos_messages(session_id);
create index if not exists idx_yleos_messages_role on yleos_messages(session_id, message_role);

alter table yleos_messages enable row level security;

create policy "yleos_messages_select_own" on yleos_messages
  for select using (auth.uid() = user_id);
create policy "yleos_messages_insert_own" on yleos_messages
  for insert with check (auth.uid() = user_id);

-- 3. comprehension_checkpoints — moments of understanding
create table if not exists comprehension_checkpoints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references focus_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept text not null,
  student_articulation text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comprehension_session on comprehension_checkpoints(session_id);

alter table comprehension_checkpoints enable row level security;

create policy "comprehension_checkpoints_select_own" on comprehension_checkpoints
  for select using (auth.uid() = user_id);
create policy "comprehension_checkpoints_insert_own" on comprehension_checkpoints
  for insert with check (auth.uid() = user_id);
