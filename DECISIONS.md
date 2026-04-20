# DECISIONS.md — Log de decisiones

## 2026-04-20 — Mejoras secuenciales: F2-F5 + E1-E4

### F2 — Browser push
- `lib/notifications/push-client.ts` (subscribe/unsubscribe), `push-server.ts` (sendPushToUser via web-push, auto-cleanup 410)
- `app/api/notifications/subscribe/route.ts` (POST/DELETE)
- ServiceWorkerRegister en layout. Toggle en Ajustes dispara flujo permisos.
- Pendiente: VAPID keys reales en Vercel.

### F3 — Email Resend
- `lib/notifications/email.ts` con sendUrgentEmail (immediate) + sendDigestEmail (acumulado)
- Templates HTML inline (sin Tailwind, hostiles a clientes email)
- From: `SEC <no-reply@sx-finance.com>`. Pendiente verificar dominio en Resend.

### F4 — Cron matriz
- `app/api/cron/notifications/route.ts` con matriz completa (deadline_proximo/hoy, atraso_critico/serio/leve, progreso_bajo)
- Idempotencia 24h. Tercera función dispatchEmailDigests envía digest.
- Dispatcher mejorado: browser push para urgent/high, email inmediato solo urgent.

### F5 — NotificationBell
- Verificado funcional desde v4.1. Polling 60s, badge unread, popover.
- TODO futuro: Supabase Realtime.

### E1 — Atajos teclado
- `hooks/useKeyboardShortcuts.ts`: H/P/E/A, Esc en inputs, Cmd+K placeholder
- KeyboardShortcuts component en layout. Ignora si usuario escribe.

### E2 — Micro-toasts
- `components/shared/MicroToast.tsx` con ToastProvider + useToast
- Auto-dismiss 3s, 3 tipos. Provider en layout.
- Pendiente: integrar en flujo completar paso/fase/entregable.

### E3 — Responsive mobile
- Media queries en globals.css: < 768px y < 480px
- Tipografía adaptativa, MomentPills solo iconos en < 480px, cards padding reducido
- prefers-reduced-motion respetado

### E4 — Transiciones momentos
- `components/shell/PageTransition.tsx` con key=pathname
- Suprime transición en /sesion y /focus (inmersión)
- Animación riseup 400ms cubic-bezier

### Pendientes futuros
- Integrar useToast en flujo real (completar paso/fase/entregable)
- Supabase Realtime en NotificationBell
- VAPID keys reales (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)
- Verificar dominio sx-finance.com en Resend
- Tests unitarios con vitest

---

## 2026-04-20 — Mejoras secuenciales: H1, PR1, F1

### PR1 — Lógica de priorización computeFocus
- Archivo: `lib/hoy/compute-focus.ts` con función pura `computeFocusSync(entregables)` + entry `computeFocus(userId, supabase)`
- Fórmula implementada exactamente según spec:
  - Paso 2 (urgentes, days<=2): sort por desempate (tipo > peso > progreso < días < título)
  - Paso 3 (no urgentes): `score = assessmentMultiplier(10/1) × weightFactor(max(w/5,1)|1) × urgencyFactor(8-d|1.5|1) × inverseProgressFactor((100-p)/50+0.5)`
- Tests: 7 + 1 extra en `lib/hoy/__tests__/compute-focus.test.ts`. Todos pasan via `npx tsx`. NO hay test runner configurado — pendiente instalar vitest o jest en siguiente sesión.
- Clasificación sumativo/formativo: heurística por `weight > 0`. Tablas no tienen columna explícita `assessment_type`, sería mejora futura.
- Logging: `[compute-focus] user=X focus=Y score=Z urgent=bool`

### H1 — Agencia en Hoy con toggle
- Migration: `supabase/migrations/20260420_hoy_modo_sugerido.sql` agrega `user_preferences.hoy_modo_sugerido` boolean default true. Usuario debe ejecutarla.
- Archivos: `app/(dashboard)/page.tsx` (server, carga data) + `app/(dashboard)/HoyView.tsx` (client, toggle + render)
- Cálculo de "primer paso pendiente": `fragment_steps` del deliverable ordenado por `step_number` ascendente, primer `completed=false`.
- Toggle persiste via `supabase.from("user_preferences").upsert({ user_id, hoy_modo_sugerido })`.
- Con modo ON: focus card grande (radius 18, padding 22×24) + compactos (radius 12, padding 12×16). Label cambia a "Sugerido por YLEOS · por urgencia + peso del entregable".
- Con modo OFF: todos al mismo nivel, título "¿En qué trabajamos hoy?".

### F1 — Endpoint analyze-semester real
- Archivo: `app/api/yleos/analyze-semester/route.ts`
- Cache: Map en memoria (no Redis por ahora), TTL 6h por usuario.
- Prompt pide JSON `{"observation": string|null}`. Si YLEOS no detecta nada, retorna null (la card no se renderiza).
- Detecta 4 situaciones: pico de carga, entregable crítico sin iniciar, distribución desbalanceada, oportunidad de reacomodo.
- Componente: `components/planificar/YleosObservationCard.tsx` (client, fetch al montar).
- Rate limit: implícito vía cache 6h. No hay rate limit adicional — si alguien resetea el cache manualmente, el endpoint se dispara de nuevo.
- Si falla Gemini: retorna 500 con error, la card simplemente no aparece (UI robusta).

### Pendientes para sesión siguiente
- F2: Browser push con Service Worker + VAPID
- F3: Email digest con Resend templates
- F4: Cron diario con matriz deadline × progreso
- F5: NotificationBell con datos reales + realtime
- E1: Atajos de teclado H/P/E/A
- E2: Micro-toasts al completar
- E3: Responsive mobile completo (breakpoints < 480px)
- E4: Transiciones entre momentos (fade + slide)
- Instalar vitest/jest como test runner oficial
- Agregar columna `assessment_type` a `deliverables` en vez de heurística por peso

---

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
