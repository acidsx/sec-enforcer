# DECISIONS.md — Log de decisiones

## [2026-04-19] Outlook Integration — Plan de implementación

- Contexto: Prompt PROMPT_OUTLOOK_INTEGRATION.md solicita integrar MS Graph + triaje de correos + hardening de focus_blocks.
- Tabla de Pomodoro existente: `focus_blocks` (columnas: id, user_id, step_id, started_at, ended_at, planned_minutes, status, notes, created_at).
- Decisión: Aplicar trigger anti-sabotaje a `focus_blocks` existente. Agregar columnas `mood_checkin` y `progress_notes` si no existen. No renombrar la tabla.
- Reversible en: migration SQL.

## [2026-04-19] Refactor Tutor Mode — Inventario

### A. Inventario obligatorio
1. **Tabla de sesiones**: `focus_blocks` (columnas: id, user_id, step_id, started_at, ended_at, planned_minutes, status, notes, created_at, mood_checkin, progress_notes)
2. **Tabla de mensajes YLEOS**: No existe. Chat es client-side only (estado React en `components/chat/YleosChat.tsx`). Se creará `yleos_messages`.
3. **Componente modo Pomodoro**: `app/(dashboard)/focus/[blockId]/page.tsx` + `components/focus/QuarantineScreen.tsx` + `components/focus/PomodoroTimer.tsx`
4. **Route handler streaming YLEOS**: `app/api/yleos/chat/route.ts`
5. **Prompt actual**: `lib/yleos/prompt.ts` — prompt corporativo táctico + contexto de sesión con instrucciones del entregable

### B. Decisiones del refactor
- `focus_blocks` se extiende con `actual_duration_minutes`, `closing_note`. No se renombra.
- `planned_minutes` ya existe como `planned_duration_minutes` equivalente. Se mantiene como está.
- Se crea `yleos_messages` con `message_role` y FK a `focus_blocks`.
- Se crea `comprehension_checkpoints` con FK a `focus_blocks`.
- Componentes de focus se refactorizan in-place: QuarantineScreen → SessionWorkspace, PomodoroTimer → AmbientTimer.
- El prompt corporativo táctico original de YLEOS se preserva en `lib/yleos/prompt.ts` (no se borra). El nuevo prompt tutor va en `lib/yleos/prompts/tutor-system.ts`.
- Paleta nueva se aplica en globals.css.
- Reversible en: revert de commits.

### Anti-sabotaje verificación SQL
```sql
-- Verificar que el trigger rechaza cambios a started_at en sesiones iniciadas:
-- INSERT INTO focus_blocks (user_id, started_at, planned_minutes, status)
--   VALUES ('test-uuid', now(), 25, 'active');
-- UPDATE focus_blocks SET started_at = now() + interval '1 hour'
--   WHERE user_id = 'test-uuid'; -- DEBE FALLAR con focus_block_locked
```
