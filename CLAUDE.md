@AGENTS.md

# CLAUDE.md — SEC (Sistema de Ejecución y Control) · v3

Contexto permanente del proyecto para Claude Code. Léelo completo al inicio de cada sesión. Fuente de verdad sobre tesis, stack, convenciones, decisiones técnicas y reglas operativas.

> **v3:** jerarquía Asignatura → Entregable → Fase → Paso. Roadmap horizontal por fases. Medallas sobrias (solo logros reales). v2 (tutor en vivo + timer ambiente) se mantiene.

---

## 1. Tesis del producto (no negociable)

SEC es una plataforma donde un estudiante universitario trabaja **acompañado por un tutor de IA en vivo** (YLEOS), enfocado en comprender lo que le están pidiendo y producir el entregable entendiendo el porqué.

El timer es indicador ambiente, no corte. YLEOS es tutor socrático, no ghostwriter. Las medallas reconocen logros reales, no métricas de uso.

---

## 2. Arquitectura de información

```
Asignatura (tabla: subjects)
  └── Entregable (tabla: deliverables)
        └── Fase (tabla: fases)
              └── Paso (tabla: fragment_steps)
```

---

## 3. Stack (fijo)

Next.js 16, TypeScript, Supabase PRO, Tailwind CSS 4, Lucide React, Gemini 2.5 Flash, Vercel PRO + Cloudflare DNS.

---

## 4. Estado del código

**Tablas**: `subjects`, `deliverables`, `fragment_steps`, `focus_blocks`, `checkins`, `work_contexts`, `ms_graph_tokens`, `outlook_drafts`, `yleos_usage`, `yleos_messages`, `comprehension_checkpoints`, `fases`, `logros`, `user_preferences`.

---

## 5. Modo de trabajo autónomo

**Ejecuta. No pidas permiso.** Detente solo en bloqueos reales.

---

## 6. Defaults técnicos

### YLEOS tutor
- Apertura socrática obligatoria. No produce el entregable. Tono: andamiaje paciente.
- Checkpoints de comprensión via `<checkpoint>` blocks.

### Timer ambiente
- 4px bar inferior, sin números. Toast al llegar a meta. Nunca auto-cerrar.

### Medallas (5 tipos)
- `primera_asignatura`, `primer_entregable`, `fase_completada`, `entregable_completado`, `semestre_completado`
- Otorgamiento via server actions, no triggers DB. Idempotente (unique constraint).
- Visual: toast discreto 3s. Sin confetti, modales, sonidos.

### Paleta
```css
--bg-canvas:#F5F1EA; --bg-surface:#FFFFFF; --bg-muted:#EAE4D9;
--text-primary:#1F1D1A; --text-secondary:#5C574F; --text-muted:#8A8478;
--accent-primary:#3E5C76; --accent-hover:#2E4A63;
--ok:#6B8E5F; --warn:#B88A4A; --urgent:#A8483A;
```

### Paleta asignaturas (8 colores cerrada)
`#3E5C76` `#6B8E5F` `#B88A4A` `#A8483A` `#7A5F8C` `#4A7A7A` `#8C6A4A` `#5C6B7A`

### Terminología
"Sesión de trabajo", "Avances y comprensión", "Logro", "Mapa del entregable", "Fase", "Paso".

---

## 7. Commits

`<tipo>(<scope>): <qué hace>`. No commitear hasta `npm run build` pase.

---

## 8. Qué NO hacer

- Renombrar tablas. Cambiar stack. Auto-cerrar sesiones. Confrontar al alumno.
- Agregar tipos de logro fuera de los 5 permitidos.
- Otorgar medallas por métricas de uso.
