-- ═══════════════════════════════════════════════════════════════
-- SEC Enforcer — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- 1. Subjects (materias/asignaturas)
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

-- 2. Deliverables (entregables extraídos del syllabus)
create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('informe','presentacion','codigo','ensayo','examen','tarea')),
  due_date date not null,
  weight integer not null default 0 check (weight >= 0 and weight <= 100),
  description text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','overdue')),
  created_at timestamptz not null default now()
);

-- 3. Fragment Steps (pasos ejecutables de cada entregable)
create table if not exists fragment_steps (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_number integer not null,
  title text not null,
  description text,
  scheduled_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(deliverable_id, step_number)
);

-- 4. Focus Blocks (sesiones de enfoque/pomodoro)
create table if not exists focus_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id uuid references fragment_steps(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  planned_minutes integer not null default 25,
  status text not null default 'planned' check (status in ('planned','active','completed','abandoned')),
  notes text,
  created_at timestamptz not null default now()
);

-- 5. Check-ins (reportes de progreso durante bloques de enfoque)
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  focus_block_id uuid not null references focus_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood integer not null check (mood >= 1 and mood <= 5),
  progress integer not null check (progress >= 0 and progress <= 100),
  note text,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

alter table subjects enable row level security;
alter table deliverables enable row level security;
alter table fragment_steps enable row level security;
alter table focus_blocks enable row level security;
alter table checkins enable row level security;

-- Each user can only access their own data
create policy "Users can manage own subjects"
  on subjects for all using (auth.uid() = user_id);

create policy "Users can manage own deliverables"
  on deliverables for all using (auth.uid() = user_id);

create policy "Users can manage own fragment_steps"
  on fragment_steps for all using (auth.uid() = user_id);

create policy "Users can manage own focus_blocks"
  on focus_blocks for all using (auth.uid() = user_id);

create policy "Users can manage own checkins"
  on checkins for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════

create index idx_deliverables_user on deliverables(user_id);
create index idx_deliverables_subject on deliverables(subject_id);
create index idx_deliverables_due_date on deliverables(due_date);
create index idx_fragment_steps_deliverable on fragment_steps(deliverable_id);
create index idx_focus_blocks_user on focus_blocks(user_id);
create index idx_focus_blocks_step on focus_blocks(step_id);
create index idx_checkins_block on checkins(focus_block_id);
