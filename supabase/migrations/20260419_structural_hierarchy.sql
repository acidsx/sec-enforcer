-- ═══════════════════════════════════════════════════════════════
-- Migration: Structural Hierarchy — Fases, Logros, Extended Subjects
-- Run in Supabase SQL Editor AFTER previous migrations
-- ═══════════════════════════════════════════════════════════════

-- 1. user_preferences
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_asignaturas_dismissed boolean not null default false,
  current_semester text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;
create policy "user_preferences_select_own" on user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Extend subjects (= asignaturas) with new columns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'subjects' and column_name = 'profesor') then
    alter table subjects add column profesor text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'subjects' and column_name = 'semestre') then
    alter table subjects add column semestre text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'subjects' and column_name = 'color') then
    alter table subjects add column color text not null default '#3E5C76';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'subjects' and column_name = 'archivada') then
    alter table subjects add column archivada boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'subjects' and column_name = 'orden') then
    alter table subjects add column orden integer not null default 0;
  end if;
end $$;

-- 3. fases — intermediate between deliverables and fragment_steps
create table if not exists fases (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  orden integer not null,
  nombre text not null,
  tipo text check (tipo in ('research','draft','review','practice','analysis','delivery','general')),
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  unique (deliverable_id, orden)
);

create index if not exists idx_fases_deliverable_orden on fases(deliverable_id, orden);

alter table fases enable row level security;
create policy "fases_select_own" on fases for select using (auth.uid() = user_id);
create policy "fases_insert_own" on fases for insert with check (auth.uid() = user_id);
create policy "fases_update_own" on fases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fases_delete_own" on fases for delete using (auth.uid() = user_id);

-- 4. Extend fragment_steps with fase_id
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'fragment_steps' and column_name = 'fase_id') then
    alter table fragment_steps add column fase_id uuid references fases(id) on delete cascade;
  end if;
end $$;

-- 5. logros — achievement system
create table if not exists logros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in (
    'primera_asignatura','primer_entregable','fase_completada',
    'entregable_completado','semestre_completado'
  )),
  titulo text not null,
  subtitulo text,
  ref_id uuid,
  ref_table text,
  metadata jsonb not null default '{}'::jsonb,
  otorgado_at timestamptz not null default now(),
  unique (user_id, tipo, ref_id)
);

create index if not exists idx_logros_user on logros(user_id, otorgado_at desc);

alter table logros enable row level security;
create policy "logros_select_own" on logros for select using (auth.uid() = user_id);
create policy "logros_insert_own" on logros for insert with check (auth.uid() = user_id);

-- 6. Backfill: create "General" fase for each existing deliverable
insert into fases (deliverable_id, user_id, orden, nombre, tipo)
select d.id, d.user_id, 1, 'General', 'general'
from deliverables d
where not exists (select 1 from fases f where f.deliverable_id = d.id)
on conflict do nothing;

-- 7. Backfill: assign existing fragment_steps to their deliverable's "General" fase
update fragment_steps fs
set fase_id = f.id
from fases f
where f.deliverable_id = fs.deliverable_id
  and f.nombre = 'General'
  and fs.fase_id is null;
