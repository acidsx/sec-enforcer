-- Migration: H1 - Hoy modo sugerido toggle
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'user_preferences' and column_name = 'hoy_modo_sugerido') then
    alter table user_preferences add column hoy_modo_sugerido boolean not null default true;
  end if;
end $$;
