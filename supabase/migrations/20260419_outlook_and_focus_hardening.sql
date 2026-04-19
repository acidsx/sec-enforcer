-- ═══════════════════════════════════════════════════════════════
-- Migration: Outlook Integration + Focus Blocks Hardening
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. work_contexts — lookup de contextos por usuario
create table if not exists work_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

alter table work_contexts enable row level security;

create policy "work_contexts_select_own" on work_contexts
  for select using (auth.uid() = user_id);
create policy "work_contexts_insert_own" on work_contexts
  for insert with check (auth.uid() = user_id);
create policy "work_contexts_update_own" on work_contexts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "work_contexts_delete_own" on work_contexts
  for delete using (auth.uid() = user_id);

-- Trigger: crear contextos default para cada usuario nuevo
create or replace function create_default_work_contexts()
returns trigger language plpgsql security definer as $$
begin
  insert into work_contexts (user_id, name, color) values
    (new.id, 'Universidad', '#6366f1'),
    (new.id, 'SXTECH', '#f97316');
  return new;
end $$;

-- Solo crear el trigger si no existe
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created_work_contexts'
  ) then
    create trigger on_auth_user_created_work_contexts
      after insert on auth.users
      for each row execute function create_default_work_contexts();
  end if;
end $$;

-- 2. ms_graph_tokens — persistencia de tokens OAuth Azure
create table if not exists ms_graph_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table ms_graph_tokens enable row level security;

create policy "ms_graph_tokens_select_own" on ms_graph_tokens
  for select using (auth.uid() = user_id);
create policy "ms_graph_tokens_insert_own" on ms_graph_tokens
  for insert with check (auth.uid() = user_id);
create policy "ms_graph_tokens_update_own" on ms_graph_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. outlook_drafts — borradores de respuesta generados por YLEOS
create table if not exists outlook_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_context_id uuid references work_contexts(id),
  source_message_id text not null,
  source_subject text,
  source_from text,
  source_snippet text,
  source_received_at timestamptz,
  draft_body text not null,
  status text not null default 'pending' check (status in ('pending','approved','sent','discarded')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index idx_outlook_drafts_idempotent
  on outlook_drafts(user_id, source_message_id);

alter table outlook_drafts enable row level security;

create policy "outlook_drafts_select_own" on outlook_drafts
  for select using (auth.uid() = user_id);
create policy "outlook_drafts_insert_own" on outlook_drafts
  for insert with check (auth.uid() = user_id);
create policy "outlook_drafts_update_own" on outlook_drafts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outlook_drafts_delete_own" on outlook_drafts
  for delete using (auth.uid() = user_id);

-- 4. yleos_usage — control de costos IA
create table if not exists yleos_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);

alter table yleos_usage enable row level security;

create policy "yleos_usage_select_own" on yleos_usage
  for select using (auth.uid() = user_id);
create policy "yleos_usage_insert_own" on yleos_usage
  for insert with check (auth.uid() = user_id);

-- 5. focus_blocks — hardening anti-sabotaje
-- Agregar columnas si no existen
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'focus_blocks' and column_name = 'mood_checkin'
  ) then
    alter table focus_blocks add column mood_checkin text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'focus_blocks' and column_name = 'progress_notes'
  ) then
    alter table focus_blocks add column progress_notes text;
  end if;
end $$;

-- Trigger anti-sabotaje: bloquea cambios a started_at, planned_minutes, step_id una vez iniciado
create or replace function focus_blocks_immutable_once_started()
returns trigger language plpgsql as $$
begin
  if old.started_at is not null then
    if new.started_at is distinct from old.started_at
       or new.planned_minutes is distinct from old.planned_minutes
       or new.step_id is distinct from old.step_id then
      raise exception 'focus_block_locked: no se puede modificar un bloque iniciado';
    end if;
  end if;
  return new;
end $$;

-- Crear trigger si no existe
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'focus_blocks_immutable'
  ) then
    create trigger focus_blocks_immutable
      before update on focus_blocks
      for each row execute function focus_blocks_immutable_once_started();
  end if;
end $$;

-- DELETE bloqueado para bloques con started_at
-- Drop existing permissive policy first, then create restricted one
do $$
begin
  -- Only create if not exists
  if not exists (
    select 1 from pg_policies where policyname = 'focus_blocks_no_delete_started' and tablename = 'focus_blocks'
  ) then
    create policy "focus_blocks_no_delete_started" on focus_blocks
      for delete using (auth.uid() = user_id and started_at is null);
  end if;
end $$;

-- Indexes
create index if not exists idx_outlook_drafts_user on outlook_drafts(user_id);
create index if not exists idx_outlook_drafts_status on outlook_drafts(user_id, status);
create index if not exists idx_yleos_usage_user on yleos_usage(user_id);
create index if not exists idx_work_contexts_user on work_contexts(user_id);
