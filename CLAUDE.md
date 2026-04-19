@AGENTS.md

# CLAUDE.md — SEC (Sistema de Ejecución y Control) · v2

Este archivo es el contexto permanente del proyecto para Claude Code. Léelo completo al inicio de cada sesión. Es fuente de verdad sobre tesis del producto, stack, convenciones, decisiones técnicas y reglas operativas.

> **v2 (cambio de tesis):** SEC dejó de ser "Pomodoro con IA al lado" para ser **tutor en vivo con timer ambiente**. El timer no corta ni estructura — acompaña. YLEOS no es asistente silencioso — es tutor socrático que inicia, explica y sostiene la comprensión. Este cambio impacta UI, prompt de YLEOS y semántica de las sesiones.

---

## 1. Tesis del producto (no negociable)

SEC es una plataforma donde un estudiante trabaja **acompañado por un tutor de IA en vivo** (YLEOS), enfocado en **comprender lo que le están pidiendo y producir el entregable entendiendo el porqué de cada decisión**.

El éxito de una sesión **no** es "25 minutos sin distraerse". Es:
1. El alumno entendió mejor lo que el profe le pide.
2. El alumno produjo algo concreto (párrafo, esquema, ejercicio resuelto, argumento).
3. El alumno sale con comprensión consolidada — capaz de explicar lo hecho a alguien más.

El timer existe para dar **sensación de contenedor temporal** (reduce ansiedad, facilita cierre), no para cortar ni forzar ritmo. Opera como indicador ambiente.

---

## 2. Identidad del proyecto

**Dominio producción:** `sec.sx-finance.com`

Funcionalidades principales:
- Ingesta de syllabus/evaluaciones (PDF o manual)
- Planificación asistida por YLEOS (con revisión humana)
- **Modo sesión de trabajo**: tutor YLEOS en vivo + texto del paso + panel de avances y comprensión + timer ambiente
- Agenda y vista de entregables con urgencia por deadline
- (Futuro) triaje de correos Outlook

---

## 3. Stack (fijo — no proponer cambios)

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Lenguaje | TypeScript (strict) |
| DB + Auth | Supabase PRO (PostgreSQL + RLS) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| IA | Google Gemini 2.5 Flash (YLEOS) |
| Deploy | Vercel PRO + Cloudflare DNS |

---

## 4. Reglas de codebase (NO negociables)

### TypeScript
- `strict: true`. Sin `any` salvo el cliente Supabase.
- Server components por default. `"use client"` solo cuando hay estado o efectos.

### Rutas protegidas
- Proxy `proxy.ts` (Next.js 16) existente valida sesión Supabase.

---

## 5. Estado del código

**Tablas existentes**: `subjects`, `deliverables`, `fragment_steps`, `focus_blocks`, `checkins`, `work_contexts`, `ms_graph_tokens`, `outlook_drafts`, `yleos_usage`.

No hay tabla de mensajes YLEOS — el chat es client-side only.

---

## 6. Modo de trabajo autónomo

**Ejecuta. No pidas permiso.** Detente solo en bloqueos reales.

---

## 7. Defaults técnicos del enfoque tutor

### Timer ambiente
- `planned_minutes` (default 25) es hint, no corte. Inmutable después de iniciar.
- Al llegar al planned: señal sutil (microanimación + toast no-bloqueante). **Nunca** auto-cerrar.
- UI: barra delgada (4px) en borde inferior. Sin números visibles por default.

### YLEOS tutor — prompt de sistema
Ubicación: `lib/yleos/prompts/tutor-system.ts`. Principios:
1. Apertura socrática obligatoria.
2. No producir el entregable por el alumno.
3. Tono: andamiaje paciente. Prohibido: confrontación, regaño, urgencia artificial.
4. Activación de conocimiento previo.
5. Explicitación de criterios de evaluación.

### Detección de inactividad
- Umbral: 4 minutos sin mensaje del alumno.
- Máximo 2 reengages por sesión.
- Solo por ausencia de mensajes, nunca por actividad del sistema.

### Comprehension checkpoints
- Tabla `comprehension_checkpoints` captura momentos de comprensión.
- YLEOS los emite como bloques `<checkpoint>...</checkpoint>` en sus respuestas.

### Paleta
```css
--bg-canvas: #F5F1EA; --bg-surface: #FFFFFF; --bg-muted: #EAE4D9;
--text-primary: #1F1D1A; --text-secondary: #5C574F; --text-muted: #8A8478;
--accent-primary: #3E5C76; --accent-hover: #2E4A63;
--ok: #6B8E5F; --warn: #B88A4A; --urgent: #A8483A;
--focus-bg: #F0ECE3; --focus-surface: #FAF7F1;
```

### Terminología UI
- "Bloque de enfoque" → "Sesión de trabajo"
- "Pomodoro" → "Sesión"
- "Avances" → "Avances y comprensión"

---

## 8. Flujo de commits

- Un commit por unidad funcional completa.
- Formato: `<tipo>(<scope>): <qué hace>`.
- No commitees hasta que `npm run build` pase.

---

## 9. Qué NO hacer

- Renombrar tablas existentes.
- Cambiar stack.
- Auto-cerrar sesiones por tiempo.
- Confrontar, regañar o apurar al alumno.
- Detectar distracción por actividad fuera del tab.
