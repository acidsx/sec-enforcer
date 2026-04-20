# Diagnóstico: estado real del rediseño v5

Fecha: 2026-04-20

## Resumen ejecutivo

El rediseño v5 **está en `main` y pusheado** (último commit `fd5439a` de hoy 2026-04-20). Sidebar viejo eliminado, layout v5 activo, dark mode purgado, redirects activos. El código local está limpio y sincronizado con remote. **Lo que sí falta**: Sprint 2-6 completos según el roadmap (archivos de `components/hoy/`, `components/sesion/`, `components/planificar/`, endpoint `analyze-semester`, etc.). Lo implementado hasta ahora es una versión monolítica en las páginas en vez de la separación en componentes modulares del spec de sprints.

**Hipótesis confirmada: #4 — Refactor parcial.** El layout v5 está activo (pills, no sidebar, paleta nueva, redirects), pero los componentes modulares de Sprints 2-6 no fueron creados como tal. Las páginas existen con su contenido inline.

**Si el usuario no ve cambios en producción**: el código está en `main` y pusheado — el problema es cache del browser o Vercel aún no deployó el último commit (~30s-2min).

## A. Estado de git

- **Rama actual:** `main`
- **Último commit:** `fd5439a` · 2026-04-20 · `fix(v5): intake con estilos v5 + ajustes inline sin links rotos`
- **Commits en últimos 2 días:** 15+ (todos los días 19 y 20 de abril)
- **Cambios sin commitear:** no
- **Commits no pusheados:** 0 (sincronizado con origin/main)

### Últimos commits relacionados con v5:
```
fd5439a fix(v5): intake con estilos v5 + ajustes inline sin links rotos
8bfefef fix(proxy): mantener /intake viva
8092f29 feat(v5): sprint 1 — infraestructura y sistema de diseño
41b0f1b fix(session): ambient timer relativo al contenedor
5b7dc64 fix(session): sesión en pantalla completa
41a1975 docs: actualiza README con arquitectura v5 por momentos
c475607 feat(v5): rediseño completo por momentos — Hoy/Planificar/Entregar/Ajustes
```

## B. Archivos del v5

### Sprint 1 — Infraestructura ✅
- [X] `app/globals.css` con tokens v5 (space-*, subject-*)
- [X] `components/shell/MomentPills.tsx`
- [X] `components/shell/AppHeader.tsx` (equivalente a AppShell header)
- [X] `components/shared/Button.tsx`
- [X] `components/shared/Chip.tsx`
- [X] `components/shared/ProgressRing.tsx`
- [X] `components/shared/AnimatedEntrance.tsx`
- [X] `components/shared/SubjectDot.tsx`
- [X] `components/notifications/NotificationBell.tsx`
- [ ] `components/shell/AppShell.tsx` como archivo separado (está inline en layout.tsx — funciona igual)

### Sprint 2 — Hoy ⚠️ Implementado monolítico
- [ ] `components/hoy/GreetingHeader.tsx` — **MISSING como archivo**, lógica en `page.tsx`
- [ ] `components/hoy/FocusCard.tsx` — **MISSING como archivo**, lógica en `page.tsx`
- [ ] `components/hoy/LaterSection.tsx` — **MISSING como archivo**, lógica en `page.tsx`
- [ ] `lib/hoy/compute-focus.ts` — **MISSING como archivo**, lógica en `page.tsx`
- [X] Funcionalidad implementada dentro de `app/(dashboard)/page.tsx` (HoyPage, FocusCard, LaterCard, EmptyState, AllDoneCard)

### Sprint 3 — En Sesión ⚠️ Usa estructura v4.2
- [X] `app/(dashboard)/sesion/[pasoId]/` directorio **vacío** (sin page.tsx)
- [X] La sesión actual usa `/focus/[blockId]` (ruta v4.2 con componentes de v4.2)
- [ ] `components/sesion/SessionTopBar.tsx` — MISSING
- [ ] `components/sesion/StepPanel.tsx` — MISSING como v5 (existe `components/session/StepPanel.tsx` de v4.2)
- [ ] `components/sesion/YleosChatPanel.tsx` — MISSING como v5
- [ ] `components/sesion/AmbientBar.tsx` — MISSING como v5

### Sprint 4 — Planificar ⚠️ Implementado monolítico
- [X] `app/(dashboard)/planificar/page.tsx` existe con week grid + timeline
- [ ] `components/planificar/WeekLoadGrid.tsx` — MISSING (inline en page.tsx)
- [ ] `components/planificar/DeliverableTimeline.tsx` — MISSING (inline)
- [ ] `components/planificar/YleosObservationCard.tsx` — MISSING
- [ ] `app/api/yleos/analyze-semester/route.ts` — **MISSING endpoint completo**

### Sprint 5 — Entregar ⚠️ Implementado sin componentes dedicados
- [X] `app/(dashboard)/entregar/page.tsx` + `app/(dashboard)/entregar/[entregableId]/page.tsx`
- [ ] `components/entregar/` **directorio no existe**
- [X] Reutiliza `components/entregable/DocumentoFinalSection.tsx` de v4.1

### Sprint 6 — Ajustes ⚠️ Simplificado
- [X] `app/(dashboard)/ajustes/page.tsx` con Perfil + Logros recientes + Panel Admin
- [ ] Subrutas `/ajustes/notificaciones`, `/ajustes/yleos`, `/ajustes/apariencia`, `/ajustes/cuenta`, `/ajustes/admin` — MISSING
- [ ] `components/ajustes/` **directorio no existe**

## C. Sidebar viejo

- **¿Sigue siendo usado en layout?:** NO
- **Ubicación actual:** `components/layout/Sidebar.tsx` (archivo huérfano)
- **Dónde se importa:** en 0 archivos del código activo (no hay imports)

El archivo existe pero no se usa. El layout nuevo en `app/(dashboard)/layout.tsx` solo importa `MomentPills` y `AppHeader`.

## D. Dark mode

- **Ocurrencias `dark:`:** 0
- **Ocurrencias `prefers-color-scheme`:** 0
- **Status:** PURGADO ✅

## E. Redirects de rutas

- **¿Existen?:** SÍ
- **Ubicación:** `proxy.ts` (middleware de Next.js 16)
- **Redirects activos:** `/asignaturas`, `/entregables`, `/agenda`, `/schedule`, `/deliverables`, `/logros`, `/notificaciones`, `/notifications`, `/mi-semana` → sus momentos correspondientes
- **Nota:** `/intake` NO redirige (mantenida viva porque "Subir syllabus" apunta ahí)

## F. Home page actual

- **Contenido:** Momento Hoy ✅ (NO es Mi Semana viejo)
- Saludo + FocusCard + LaterCards + EmptyState/AllDoneCard
- Todo inline en el mismo `page.tsx` (no separado en componentes)

## G. Vercel

(El usuario debe verificar manualmente)

Último commit `fd5439a` se pusheó hoy. Vercel debe haber hecho auto-deploy. Si el usuario ve la UI vieja:
- Hard refresh (Ctrl+Shift+R)
- Verificar en Vercel dashboard que el deploy del commit `fd5439a` esté "Ready" no "Building"

## H. DECISIONS.md

- **Entradas recientes:** Última entrada es del 2026-04-19 (v4 inventario)
- **Status:** NO tiene entradas de v5. Claude Code no documentó las decisiones del rediseño v5 aunque sí implementó el código.

## Diagnóstico final

**Hipótesis confirmada: #4 — Refactor parcial.**

Pero con un matiz: no es que falte el refactor, sino que **la estructura de archivos no sigue el spec de sprints modular** (archivos separados por componente). Todo está implementado **monolíticamente dentro de las páginas**, lo que funciona igual visualmente pero rompe la arquitectura propuesta para mantenibilidad futura.

Desglose:
- ✅ Sprint 1 completo con archivos separados
- ⚠️ Sprint 2 implementado pero inline en `page.tsx`
- ⚠️ Sprint 3 **solo la ruta `/focus/[blockId]` de v4.2** funciona. `/sesion/[pasoId]` no tiene page.tsx. Los componentes son de v4.2, no v5.
- ⚠️ Sprint 4 implementado pero inline en `page.tsx`. Sin endpoint `analyze-semester`. Sin card de observación de YLEOS.
- ⚠️ Sprint 5 implementado pero sin componentes dedicados ni FormalChecklist, ReviewPanel separados. Sin TricolorRibbon. Sin shimmer en CTA.
- ⚠️ Sprint 6 simplificado drásticamente — solo Perfil, Logros y Admin toggle. Falta: 5 subrutas completas, secciones Notificaciones/YLEOS/Apariencia/Cuenta completas, preferencias de usuario editables, stats detalladas, zona peligro, sesiones activas, etc.

## Próximo paso sugerido

Opción A — **Si el usuario quiere fidelidad al spec de sprints**:
Ejecutar Sprints 2-6 como cada uno pide: refactorizar las páginas inline en componentes modulares separados + completar lo que falta (componentes `hoy/`, `sesion/`, `planificar/`, `entregar/`, endpoint `analyze-semester`, 5 subrutas de Ajustes, etc.).

Opción B — **Si el usuario quiere iterar sobre lo existente**:
Identificar qué pantallas específicas se ven "con diseño viejo" o desproporcionadas y atacar esos puntos. Lo que hay funciona — el rediseño está activo — pero quizás falte pulido visual en secciones concretas.

**Recomendación**: antes de ejecutar Sprints 2-6, que el usuario confirme en producción qué pantallas específicas ve con diseño viejo (hacer screenshots o pegar URLs). Es posible que solo sea cache del navegador o deploy en curso. Si sigue viendo UI vieja tras hard refresh y el deploy está Ready en Vercel, entonces hay bug específico de render que investigar.
