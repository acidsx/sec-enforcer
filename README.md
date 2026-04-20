# SEC — Sistema de Ejecución y Control · v5

Plataforma de gestión académica diseñada por **momentos del usuario**, no por vistas CRUD. Un tutor IA en vivo (**YLEOS** con 3 modos: Analista, Tutor, Revisor) acompaña al alumno a comprender evaluaciones, planificar el semestre, trabajar en sesiones de 25 min y entregar con confianza.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Lenguaje**: TypeScript (strict)
- **Database & Auth**: Supabase PRO (PostgreSQL + RLS)
- **AI**: Google Gemini 2.5 Flash (YLEOS — prompt propietario)
- **Styling**: Tailwind CSS 4 + design tokens CSS
- **Icons**: Lucide React
- **Email**: Resend
- **Correo corp.**: Microsoft Graph (admin-only, standby)
- **Deploy**: Vercel PRO + Cloudflare DNS

## Arquitectura por momentos (v5)

En vez de sidebar con listas planas, la app se organiza por lo que el usuario está haciendo mentalmente:

### 1. Hoy — "¿Qué hago ahora?"
Una sola tarjeta de foco con el paso actual prioritario. CTA directo a sesión de 25 min. Sin ruido.

### 2. En sesión — "Estoy trabajando. No me molesten."
Layout 50/50: paso actual + chat YLEOS Tutor. Timer ambiente (barra 4px al pie, sin números prominentes). Notificaciones suprimidas salvo urgent.

### 3. Planificar — "¿Cómo se ve mi semestre?"
Grid de carga por semana (8 semanas, colores por densidad) + timeline de próximos entregables con progress rings. Quick actions: subir syllabus, revisar carga con YLEOS Analista.

### 4. Entregar — "¿Ya puedo enviarlo?"
Documento final + verdict de YLEOS Revisor (ready/needs_work/critical) + checklist formal. Marcar como entregado es irreversible.

### Ajustes
Perfil, YLEOS Acelerado (admin-only), shortcuts a vistas complementarias (Asignaturas, Logros, Notificaciones).

## YLEOS — 3 modos

- **Analista**: al subir PDF. Identifica tipo de evaluación, trampas de rúbrica, propone fases y pasos concretos.
- **Tutor**: durante sesión. Apertura socrática, andamiaje paciente, checkpoints de comprensión. Prohibido escribir el entregable.
- **Revisor**: pre-entrega. Diagnóstico contra rúbrica, veredicto, sin reescribir.

**Modo Acelerado** (admin-only): andamiaje más completo, pero el límite ético duro sigue — YLEOS nunca produce el entregable por el alumno.

## Jerarquía de información

```
Asignatura (con color propio de paleta cerrada)
  └── Entregable (archivo físico que se sube al profe)
        └── Fase (etapa de trabajo, 3-5 por entregable)
              └── Paso (acción concreta de 25 min)
```

## Medallas

5 tipos cerrados por logros reales (no métricas de uso):
- `primera_asignatura`, `primer_entregable`, `fase_completada`, `entregable_completado`, `semestre_completado`

## Notificaciones tri-canal

- **In-app**: campana con contador + popover
- **Browser push**: Web Push con Service Worker + VAPID
- **Email**: via Resend, inmediato para `high`/`urgent`, digest diario para resto

Cron diario con matriz **deadline × progreso** decide cuándo notificar.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Migrations (en orden)

Ejecutar en Supabase SQL Editor:
1. `supabase/schema.sql` — tablas base (subjects, deliverables, fragment_steps, focus_blocks, checkins)
2. `supabase/migrations/20260419_outlook_and_focus_hardening.sql` — work_contexts, ms_graph_tokens, outlook_drafts, yleos_usage + anti-sabotaje
3. `supabase/migrations/20260419_tutor_mode.sql` — yleos_messages, comprehension_checkpoints
4. `supabase/migrations/20260419_structural_hierarchy.sql` — fases, logros, user_preferences
5. `supabase/migrations/20260419_v4_roles_yleos_modes.sql` — user_roles + Acelerado trigger
6. `supabase/migrations/20260419_v4_1_notifs_docs.sql` — notifications, push_subscriptions, entregables_documentos, yleos_reviews

### Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Gemini
GEMINI_API_KEY=

# Notifications
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
RESEND_API_KEY=

# Outlook (admin, opcional — standby)
AZURE_CLIENT_ID=
AZURE_TENANT_ID=common
MS_GRAPH_REDIRECT_URL=
```

## Reglas duras (no negociables)

- **Light mode only** — sin dark mode en ninguna forma
- **YLEOS nunca escribe el entregable completo** — ni siquiera en Acelerado
- **Sesiones inmutables** — `started_at` no se puede modificar una vez iniciado
- **Una acción primaria por pantalla**
- **Timer ambiente, no corte** — nunca auto-cerrar sesión
- **Logros por resultados reales** — nunca por minutos/streaks

## Arquitectura técnica

```
sec.sx-finance.com (Cloudflare DNS, gris)
  └── Vercel PRO
        ├── Next.js 16 App Router (server components default)
        ├── Proxy middleware → validación sesión Supabase
        ├── API routes para YLEOS/documentos/notificaciones
        ├── Cron diario (/api/cron/notifications)
        └── Service Worker para push
  
  → Supabase PRO (DB + Auth + RLS + Storage)
  → Gemini 2.5 Flash (YLEOS 3 modos)
  → Resend (emails)
```

## Dominio

Producción: `sec.sx-finance.com`
