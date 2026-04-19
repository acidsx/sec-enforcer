-- ═══════════════════════════════════════════════════════════════
-- Migration v4: Roles, YLEOS Modes, Session Summary
-- Run in Supabase SQL Editor AFTER previous migrations
-- ═══════════════════════════════════════════════════════════════

-- 1. user_roles
create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'student')),
  assigned_at timestamptz not null default now()
);

alter table user_roles enable row level security;
create policy "user_roles_select_own" on user_roles for select using (auth.uid() = user_id);

-- Trigger: assign role on signup
create or replace function assign_role_on_signup()
returns trigger language plpgsql security definer as $$
begin
  insert into user_roles (user_id, role)
  values (
    new.id,
    case
      when new.email = 'andres.cidb@gmail.com' then 'admin'
      else 'student'
    end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created_assign_role on auth.users;
create trigger on_auth_user_created_assign_role
  after insert on auth.users
  for each row execute function assign_role_on_signup();

-- Backfill existing users
insert into user_roles (user_id, role)
select
  id,
  case when email = 'andres.cidb@gmail.com' then 'admin' else 'student' end
from auth.users
where id not in (select user_id from user_roles)
on conflict do nothing;

-- 2. Extend user_preferences with accelerated toggle
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'user_preferences' and column_name = 'yleos_accelerated_on') then
    alter table user_preferences add column yleos_accelerated_on boolean not null default false;
  end if;
end $$;

-- Trigger: only admin can have accelerated on
create or replace function check_accelerated_admin_only()
returns trigger language plpgsql as $$
begin
  if new.yleos_accelerated_on = true then
    if not exists (select 1 from user_roles where user_id = new.user_id and role = 'admin') then
      raise exception 'yleos_accelerated_on requires admin role';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists check_accelerated_on_user_preferences on user_preferences;
create trigger check_accelerated_on_user_preferences
  before insert or update on user_preferences
  for each row execute function check_accelerated_admin_only();

-- 3. Extend focus_blocks with session summary
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'focus_blocks' and column_name = 'summary') then
    alter table focus_blocks add column summary text;
  end if;
end $$;

-- 4. Extend yleos_usage with mode and accelerated
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'yleos_usage' and column_name = 'mode') then
    alter table yleos_usage add column mode text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'yleos_usage' and column_name = 'accelerated') then
    alter table yleos_usage add column accelerated boolean not null default false;
  end if;
end $$;

-- 5. Admin-only RLS for ms_graph_tokens (drop existing permissive policies, add admin-only)
do $$
begin
  -- Drop old permissive policies if they exist
  drop policy if exists "ms_graph_tokens_select_own" on ms_graph_tokens;
  drop policy if exists "ms_graph_tokens_insert_own" on ms_graph_tokens;
  drop policy if exists "ms_graph_tokens_update_own" on ms_graph_tokens;

  -- Create admin-only policies
  create policy "ms_graph_tokens_select_admin" on ms_graph_tokens
    for select using (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
  create policy "ms_graph_tokens_insert_admin" on ms_graph_tokens
    for insert with check (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
  create policy "ms_graph_tokens_update_admin" on ms_graph_tokens
    for update using (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
exception
  when undefined_object then null; -- policies didn't exist
end $$;

-- 6. Admin-only RLS for outlook_drafts
do $$
begin
  drop policy if exists "outlook_drafts_select_own" on outlook_drafts;
  drop policy if exists "outlook_drafts_insert_own" on outlook_drafts;
  drop policy if exists "outlook_drafts_update_own" on outlook_drafts;
  drop policy if exists "outlook_drafts_delete_own" on outlook_drafts;

  create policy "outlook_drafts_select_admin" on outlook_drafts
    for select using (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
  create policy "outlook_drafts_insert_admin" on outlook_drafts
    for insert with check (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
  create policy "outlook_drafts_update_admin" on outlook_drafts
    for update using (auth.uid() = user_id and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));
exception
  when undefined_object then null;
end $$;
