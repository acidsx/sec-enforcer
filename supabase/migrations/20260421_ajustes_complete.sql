-- ═══════════════════════════════════════════════════════════════
-- Migration: Sprint Ajustes — columnas completas en user_preferences
-- ═══════════════════════════════════════════════════════════════

-- Identidad y contexto
alter table user_preferences add column if not exists nombre_yleos_llama text;
alter table user_preferences add column if not exists universidad text;
alter table user_preferences add column if not exists carrera text;
alter table user_preferences add column if not exists ano_academico text;
alter table user_preferences add column if not exists contexto_laboral text;
alter table user_preferences add column if not exists zona_horaria text default 'America/Santiago';
alter table user_preferences add column if not exists inicio_semana text default 'lunes' check (inicio_semana in ('lunes','domingo'));

-- YLEOS
alter table user_preferences add column if not exists tono_yleos text default 'cercano' check (tono_yleos in ('cercano','profesional','formal'));
alter table user_preferences add column if not exists cadencia_preguntas text default 'balanceada' check (cadencia_preguntas in ('minima','balanceada','maxima'));
alter table user_preferences add column if not exists idioma_yleos text default 'es-CL' check (idioma_yleos in ('es-CL','es-neutro','en','pt'));
alter table user_preferences add column if not exists reengage_enabled boolean default true;
alter table user_preferences add column if not exists reengage_minutes int default 4;
alter table user_preferences add column if not exists checkpoints_visibles boolean default true;
alter table user_preferences add column if not exists sugerir_micro_breaks boolean default true;
alter table user_preferences add column if not exists memoria_entre_sesiones boolean default true;
alter table user_preferences add column if not exists memoria_sesiones_n int default 5;
alter table user_preferences add column if not exists temperatura_modelo text default 'default' check (temperatura_modelo in ('default','conservador','exploratorio'));

-- Apariencia
alter table user_preferences add column if not exists densidad_ui text default 'comoda' check (densidad_ui in ('compacta','comoda','espaciosa'));
alter table user_preferences add column if not exists canvas_tono text default 'calido' check (canvas_tono in ('calido','puro'));
alter table user_preferences add column if not exists tipografia_paso text default 'serif' check (tipografia_paso in ('serif','sans'));
alter table user_preferences add column if not exists tamano_texto int default 100 check (tamano_texto between 80 and 140);
alter table user_preferences add column if not exists animaciones text default 'completas' check (animaciones in ('completas','reducidas','ninguna'));

-- Atajos teclado
alter table user_preferences add column if not exists keyboard_shortcuts_enabled boolean default true;

-- Notificaciones
alter table user_preferences add column if not exists notif_email_digest_hour int default 7 check (notif_email_digest_hour between 0 and 23);
alter table user_preferences add column if not exists notif_silent_in_session boolean default true;
alter table user_preferences add column if not exists notif_skip_weekends boolean default false;
alter table user_preferences add column if not exists notif_matrix jsonb default '{}'::jsonb;

-- Feature flags (solo admin edita)
create table if not exists feature_flags (
  flag_key text primary key,
  enabled boolean not null default false,
  status text not null default 'off' check (status in ('on','off','beta')),
  description text,
  updated_at timestamptz not null default now()
);

-- Seed de feature flags conocidos
insert into feature_flags (flag_key, enabled, status, description) values
  ('outlook_integration', false, 'off', 'Módulo correo Outlook (requiere Azure AD)'),
  ('yleos_accelerated_global', true, 'on', 'YLEOS Acelerado disponible para admin'),
  ('analyze_semester_realtime', true, 'on', 'Endpoint analyze-semester con cache 6h'),
  ('command_palette', false, 'beta', 'Cmd+K palette global')
on conflict (flag_key) do nothing;

alter table feature_flags enable row level security;
create policy "feature_flags_select_all" on feature_flags for select using (true);
-- Solo admin puede modificar (via server action con requireAdmin)
