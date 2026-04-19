@AGENTS.md

# CLAUDE.md — SEC (Sistema de Ejecución y Control) · v4

Contexto permanente del proyecto. Fuente de verdad sobre tesis, stack, convenciones y reglas.

> **v4:** Roles admin/student. YLEOS 3 modos (Analista/Tutor/Revisor). Acelerado admin-only. Correo admin-only. Mi Semana reemplaza Agenda. Light mode only.

---

## 1. Tesis (no negociable)

Tutor IA en vivo (YLEOS) que ayuda al alumno a **comprender y producir**, no a copiar. Timer ambiente. Medallas por logros reales. Límite ético duro: SEC no produce entregables completos.

## 2. Jerarquía: Asignatura → Entregable → Fase → Paso

## 3. Stack: Next.js 16, TypeScript, Supabase PRO, Tailwind CSS 4, Lucide, Gemini 2.5 Flash, Vercel PRO + Cloudflare

## 4. Reglas duras
- Light mode only. Sin dark mode en ninguna forma.
- Proxy `proxy.ts` valida sesión. Rutas admin redirigen a 404 para student.
- YLEOS nunca escribe el entregable por el alumno.

## 5. Roles
- `admin`: acceso completo, YLEOS Acelerado, módulo Correo
- `student`: default, sin Acelerado ni Correo
- Asignación por email via trigger. No editable desde UI.

## 6. YLEOS 3 modos
- **Analista**: análisis de PDFs, plan de fases, trampas de rúbrica
- **Tutor**: sesión en vivo, apertura socrática, checkpoints comprensión
- **Revisor**: diagnóstico pre-entrega contra rúbrica, sin reescribir

## 7. Paleta light-only
```css
--bg-canvas:#F5F1EA; --bg-surface:#FFFFFF; --bg-muted:#EAE4D9;
--text-primary:#1F1D1A; --text-secondary:#5C574F; --text-muted:#8A8478;
--accent-primary:#3E5C76; --accent-hover:#2E4A63;
--ok:#6B8E5F; --warn:#B88A4A; --urgent:#A8483A;
```

## 8. Terminología
"Sesión de trabajo", "Mi semana", "Mapa del entregable", "Logro", "Fase", "Paso"

## 9. NO hacer
Renombrar tablas. Dark mode. Auto-cerrar sesiones. Confrontar alumno. Logros por métricas. Entregable completo via YLEOS. Correo para student.
