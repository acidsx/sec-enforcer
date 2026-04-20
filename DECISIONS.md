# DECISIONS.md — Log de decisiones

## 2026-04-20 — Reparación v5 funcional

### Fixes aplicados
1. **Ruta `/sesion/[pasoId]`**: creado `page.tsx` que redirige a `/focus/new?stepId=[pasoId]`. Razón: mantener backward compat con cualquier link futuro a la ruta v5 reutilizando el flujo v4.2 ya funcional (crea focus_block y redirige a `/focus/[blockId]` con layout de sesión). Sprint 3 real lo reemplaza después.
2. **Botón "Empezar sesión" en Hoy**: verificado — ya usa `<Link href="/focus/new?stepId=${step.id}">`. Sin cambios necesarios.
3. **Endpoint `/api/yleos/analyze-semester`**: placeholder creado que retorna `{ observation: null }`. Planificar actual no lo consume, no requiere guardia en UI.
4. **Rutas huérfanas**: 0 directorios vacíos sin page.tsx ni subdirs tras este fix.

### Smoke test (post-deploy pendiente del usuario)
1. Home Hoy renderiza: PENDIENTE USUARIO
2. Click Empezar sesión navega: PENDIENTE USUARIO
3. YLEOS responde: PENDIENTE USUARIO
4. Planificar renderiza: PENDIENTE USUARIO
5. Ajustes renderiza: PENDIENTE USUARIO

### Pendientes para sesión siguiente (mejoras, no reparación)
- Implementar `/api/yleos/analyze-semester` real con llamada a YLEOS Analista sobre el semestre
- Refactorizar Sprints 2/4/5/6 monolíticos a componentes modulares (`components/hoy/*`, `components/planificar/*`, etc.)
- Completar 5 subrutas Ajustes (notificaciones, yleos, apariencia, cuenta, admin dedicada)
- Sprint 3 completo: `/sesion/[pasoId]` con layout v5 propio (split 50/50, SessionTopBar, StepPanel v5, YleosChatPanel v5, AmbientBar v5) en vez del redirect actual

---

## [2026-04-19] v4 — Inventario y Plan

### Inventario
1. Tabla sesiones: `focus_blocks`
2. Tabla mensajes: `yleos_messages` (creada en v2)
3. Ruta Agenda: `app/(dashboard)/schedule/page.tsx` — se mantiene pero home es Mi Semana
4. `user_preferences` existe (creada en v3)
5. Dark mode: `grep -rn "dark:" app components` → 0 resultados. No hay dark mode.
6. Prompt v3: `lib/yleos/prompts/tutor-system.ts` — preservado, reemplazado por `system.ts` con 3 modos.

### Decisiones v4
- `user_roles` creada con trigger por email. Admin email hardcoded como `andres.cidb@gmail.com` en trigger.
- Correo module: rutas existentes en `/triage` se mantienen. Sidebar condicional por rol.
- Mi Semana reemplaza Dashboard como home. Agenda se mantiene como ruta alternativa.
- YLEOS system.ts unifica los 3 modos (analyst, tutor, reviewer) en un solo archivo.
- `focus_blocks.summary` para memoria entre sesiones.
- `yleos_usage` extendido con `mode` y `accelerated`.
- Light mode: paleta completa en globals.css. Legacy tokens mapeados a light values.
- Login page: usa tokens CSS que ahora son light.
- Reversible en: revert de commits.

### Verificaciones
```sql
-- Trigger de rol: un user con email 'andres.cidb@gmail.com' debe tener role='admin'
-- Trigger de accelerated: UPDATE user_preferences SET yleos_accelerated_on=true WHERE user_id='student-uuid' DEBE FALLAR
```
