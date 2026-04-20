-- ═══════════════════════════════════════════════════════════════
-- Migration v4.1: Notifications, Documents, Push Subscriptions
-- ═══════════════════════════════════════════════════════════════

-- 1. Extend user_preferences
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'user_preferences' and column_name = 'notif_inapp_enabled') then
    alter table user_preferences add column notif_inapp_enabled boolean not null default true;
    alter table user_preferences add column notif_browser_enabled boolean not null default false;
    alter table user_preferences add column notif_email_enabled boolean not null default false;
    alter table user_preferences add column notif_email_digest_hour integer not null default 8 check (notif_email_digest_hour between 0 and 23);
  end if;
end $$;

-- 2. notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'deadline_proximo','progreso_bajo','fase_completada_logro',
    'entregable_completado_logro','sesion_sugerida','revisor_listo','sistema'
  )),
  title text not null,
  body text,
  ref_id uuid,
  ref_table text,
  read_at timestamptz,
  dispatched_inapp_at timestamptz,
  dispatched_browser_at timestamptz,
  dispatched_email_at timestamptz,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread on notifications(user_id, read_at) where read_at is null;
create index if not exists idx_notifications_user_created on notifications(user_id, created_at desc);

alter table notifications enable row level security;
create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on notifications for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);

-- 3. push_subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table push_subscriptions enable row level security;
create policy "push_subscriptions_select_own" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own" on push_subscriptions for delete using (auth.uid() = user_id);

-- 4. Extend deliverables with rubric_text
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'deliverables' and column_name = 'rubric_text') then
    alter table deliverables add column rubric_text text;
  end if;
end $$;

-- 5. entregables_documentos
create table if not exists entregables_documentos (
  id uuid primary key default gen_random_uuid(),
  entregable_id uuid not null references deliverables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  extracted_text text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending','success','failed','unsupported')),
  status text not null default 'en_progreso'
    check (status in ('sin_iniciar','en_progreso','listo_para_revisar','revisado','entregado')),
  last_review_id uuid,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entregable_id)
);

alter table entregables_documentos enable row level security;
create policy "entregables_documentos_select_own" on entregables_documentos for select using (auth.uid() = user_id);
create policy "entregables_documentos_insert_own" on entregables_documentos for insert with check (auth.uid() = user_id);
create policy "entregables_documentos_update_own" on entregables_documentos for update using (auth.uid() = user_id);

-- 6. yleos_reviews
create table if not exists yleos_reviews (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references entregables_documentos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);

alter table yleos_reviews enable row level security;
create policy "yleos_reviews_select_own" on yleos_reviews for select using (auth.uid() = user_id);
create policy "yleos_reviews_insert_own" on yleos_reviews for insert with check (auth.uid() = user_id);

-- FK for last_review_id
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_last_review') then
    alter table entregables_documentos
      add constraint fk_last_review foreign key (last_review_id) references yleos_reviews(id) on delete set null;
  end if;
end $$;

-- 7. Storage bucket (run manually in Supabase Dashboard if this fails)
-- insert into storage.buckets (id, name, public) values ('drafts-finales', 'drafts-finales', false) on conflict do nothing;
