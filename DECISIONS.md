# DECISIONS.md — Log de decisiones

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
