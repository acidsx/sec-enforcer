# DECISIONS.md — Log de decisiones

## [2026-04-19] Outlook Integration — Plan de implementación

- Contexto: Prompt PROMPT_OUTLOOK_INTEGRATION.md solicita integrar MS Graph + triaje de correos + hardening de focus_blocks.
- Tabla de Pomodoro existente: `focus_blocks` (columnas: id, user_id, step_id, started_at, ended_at, planned_minutes, status, notes, created_at).
- Decisión: Aplicar trigger anti-sabotaje a `focus_blocks` existente. Agregar columnas `mood_checkin` y `progress_notes` si no existen. No renombrar la tabla.
- La columna `planned_minutes` del schema existente corresponde a `duration_minutes` del prompt. Usar `planned_minutes` (ya existe).
- La columna `step_id` corresponde a `task_ref`. Usar `step_id` (ya existe como FK a fragment_steps).
- Reversible en: migration SQL.

## [2026-04-19] Supabase client pattern

- Contexto: CLAUDE.md dice usar singleton directo. Código existente usa wrappers en `@/lib/supabase/client.ts` y `server.ts`.
- Decisión: Código existente funciona y está en producción. No reescribir. Nuevo código de Outlook usará los wrappers existentes para consistencia. Migrar al singleton se hará en un refactor futuro si se solicita.
- Reversible en: refactor de imports.

## [2026-04-19] Anti-sabotaje verificación SQL

```sql
-- Verificar que el trigger rechaza cambios a started_at en bloques iniciados:
-- INSERT INTO focus_blocks (user_id, started_at, planned_minutes, status)
--   VALUES ('test-uuid', now(), 25, 'active');
-- UPDATE focus_blocks SET started_at = now() + interval '1 hour'
--   WHERE user_id = 'test-uuid'; -- DEBE FALLAR con focus_block_locked
```
