@AGENTS.md

# CLAUDE.md — SEC v5

Fuente de verdad del producto SEC (Sistema de Ejecución y Control). Léelo completo al inicio de cada sesión. Reemplaza todas las versiones anteriores (v3, v4, v4.1, v4.2).

> **v5:** arquitectura de 4 momentos (Hoy / En Sesión / Planificar / Entregar) más Ajustes, reemplazando las 8 vistas CRUD anteriores. El sidebar tradicional desaparece. Navegación por pills al pie. Ajustes vive en capa aparte con 5 secciones (Perfil, Notificaciones, YLEOS, Apariencia, Cuenta) + Panel Admin.

---

## 1. Tesis del producto (no negociable)

SEC es una plataforma donde un estudiante universitario trabaja **acompañado por un tutor de IA en vivo** (YLEOS), enfocado en **comprender lo que le piden y producir el entregable entendiendo el porqué de cada decisión**.

Éxito de una sesión:
1. El alumno entendió mejor lo que el profe le pide
2. El alumno produjo algo concreto (producido por él, no por YLEOS)
3. El alumno sale con comprensión consolidada

**Segmento único:** universitarios.

**Límite ético duro:** SEC no produce entregables completos en nombre del alumno. Aplica a todos los modos de YLEOS, incluido Acelerado.

---

## 2. Arquitectura de 4 momentos

- **HOY** (`/`) — "¿Qué hago ahora?" Una sola tarjeta de foco + later cards
- **EN SESIÓN** (`/sesion/[pasoId]` o `/focus/[blockId]`) — Layout 50/50 inmersivo, sin nav
- **PLANIFICAR** (`/planificar`) — Vista pájaro del semestre
- **ENTREGAR** (`/entregar/[entregableId]`) — Ritual de entrega con Revisor
- **AJUSTES** (`/ajustes`) — 5 secciones + Panel Admin

Pills al pie siempre visibles salvo en En Sesión.

---

## 3. Stack (fijo)

Next.js 16, TypeScript, Supabase PRO, Tailwind CSS 4, Lucide React, Gemini 2.5 Flash, Vercel PRO + Cloudflare. Correo MS Graph admin-only (standby).

---

## 4. Reglas duras (NO negociables)

- **Light mode only.** Sin `dark:`, sin `prefers-color-scheme`, sin toggle.
- **YLEOS nunca escribe el entregable completo.** Ni siquiera Acelerado.
- **Peso tipográfico máximo 500.** Jerarquía por tamaño + color.
- **Autosave, no "Guardar cambios".** Optimistic update.
- **Una acción primaria por pantalla.**
- **Sesiones inmutables.** `started_at` no se modifica una vez iniciado.
- **Timer ambiente, no corte.** Nunca auto-cerrar.
- **Logros por resultados reales,** nunca por minutos/streaks.
- **Rol admin solo vía SQL,** nunca desde UI.

---

## 5. Paleta y tipografía

```css
--bg-canvas: #F5F1EA; --bg-surface: #FFFFFF; --bg-muted: #EAE4D9; --bg-elevated: #FAF7F1;
--text-primary: #1F1D1A; --text-secondary: #5C574F; --text-tertiary: #8A8478;
--accent-primary: #1F1D1A; --accent-info: #378ADD; --accent-urgent: #D85A30;
--accent-success: #1D9E75; --accent-warning: #BA7517;
```

Asignaturas (paleta cerrada 8):
`#7F77DD #1D9E75 #D85A30 #D4537E #BA7517 #378ADD #639922 #A32D2D`

Spacing: múltiplos de 4 (space-1..space-16).
Radius: r-sm 6, r-md 10, r-lg 14, r-xl 20, r-pill 999.

Typography: Inter (sans), Source Serif 4 (serif paso sesión + lectura larga YLEOS), JetBrains Mono (timers, fechas).
Escala: display 42, h1 34, h2 22, h3 16-18, body 14, caption 13, label 11, micro 10.

---

## 6. YLEOS 3 modos

- **Analista**: PDF upload, análisis estratégico con trampas de rúbrica
- **Tutor**: sesión en vivo, modo socrático, checkpoints
- **Revisor**: pre-entrega, diagnóstico contra rúbrica

Acelerado (admin-only): extiende Tutor con más andamiaje. Nunca escribe el entregable.

---

## 7. Jerarquía de datos

```
Asignatura (paleta cerrada 8 colores)
  └── Entregable (NOT NULL asignatura_id, = archivo físico)
        └── Fase (reorderable, tipo research/draft/review/practice/analysis/delivery/general)
              └── Paso (acción de 25 min)
```

---

## 8. Roles

- `admin` → una sola cuenta (Andrés, `andres.cidb@gmail.com`)
- `student` → todos los demás

Permisos admin: YLEOS Acelerado, módulo Correo, Panel Admin en Ajustes, feature flags edit.

---

## 9. Rutas vivas / deprecadas

Vivas: `/`, `/planificar`, `/entregar/[id]`, `/sesion/[id]` (y `/focus/[id]` por compat), `/ajustes`, `/ajustes/{notificaciones,yleos,apariencia,cuenta,admin}`, `/correo/*` (admin).

Deprecadas (redirigen):
- `/asignaturas` → `/planificar`
- `/entregables` → `/planificar`
- `/agenda` → `/planificar`
- `/logros` → `/ajustes`
- `/notificaciones` → `/`
- `/ingesta` → `/planificar`
- `/mi-semana` → `/`

---

## 10. Principios de producto

1. Una pregunta por pantalla
2. Opinión antes que opciones
3. Temporal, no modal
4. Densidad con respiración
5. Animación con función
6. Inmersión sagrada (En Sesión no se interrumpe)
7. Rito en el cierre (Entregar)
8. Honestidad con el usuario

---

## 11. Archivos de control

- `CLAUDE.md` — este archivo
- `DECISIONS.md` — log append-only
- `docs/yleos-v4.md` — referencia prompt YLEOS
