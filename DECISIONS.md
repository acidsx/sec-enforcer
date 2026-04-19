# DECISIONS.md — Log de decisiones

## [2026-04-19] Refactor Estructural v3 — Inventario y Plan

### Inventario
1. Tabla asignaturas = `subjects` (ya existe con: id, user_id, name, code, created_at). Se extiende con: profesor, semestre, color, archivada, orden.
2. Tabla entregables = `deliverables` (ya tiene subject_id FK). No necesita nueva FK.
3. Tabla pasos = `fragment_steps`. Se extiende con fase_id FK.
4. Tabla sesiones = `focus_blocks`.
5. Tabla mensajes = `yleos_messages` (creada en v2).
6. No existe: fases, logros, user_preferences.
7. Rutas: home=`/`, agenda=`/schedule`, entregables=`/deliverables`, sesión=`/focus/[blockId]`, ingesta=`/intake`.

### Decisiones
- `subjects` no se renombra a `asignaturas`. Se extiende in-place. Es la tabla de asignaturas.
- `deliverables.subject_id` ya existe como FK a subjects. No necesita nueva columna `asignatura_id`.
- Backfill: crear fase "General" por cada deliverable existente, asignar fragment_steps sin fase a esa fase.
- NOT NULL de `fase_id` en fragment_steps NO se aplica en migration para preservar compatibilidad con código existente que no pasa fase_id.
- YLEOS plan generation extendido para devolver fases agrupadas.
- Logros: server actions en `lib/actions/logros.ts`, no triggers DB.
- Reversible en: revert de commits.

### Verificación anti-sabotaje
```sql
-- El trigger de v2 sigue activo en focus_blocks
-- UPDATE focus_blocks SET started_at = now() + interval '1 hour'
--   WHERE started_at IS NOT NULL; -- DEBE FALLAR
```
