@AGENTS.md

# CLAUDE.md — SEC (Sistema de Ejecución y Control)

Este archivo es el contexto permanente del proyecto para Claude Code. Léelo completo al inicio de cada sesión. Trátalo como fuente de verdad sobre convenciones, decisiones técnicas y reglas operativas.

---

## 1. Identidad del proyecto

**SEC** es una plataforma de gestión académica + ejecutiva para un solo perfil de usuario (Andrés Cid, Gerente General de SXTECH y estudiante universitario). Combina:

- Ingesta de syllabus universitarios (PDF o manual)
- Ingesta de correos corporativos de Outlook 365 (MS Graph API)
- Fragmentación de entregables y correos en tareas ejecutables (vía YLEOS/Gemini)
- Bloques de enfoque Pomodoro de 25 min con asistencia IA en vivo
- Triaje asistido de correos con borradores de respuesta aprobables

**Dominio producción:** `sec.sx-finance.com`

---

## 2. Stack (fijo — no proponer cambios)

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Lenguaje | TypeScript (strict) |
| DB + Auth | Supabase PRO (PostgreSQL + RLS) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| IA | Google Gemini 2.5 Flash (YLEOS) |
| Correo | Microsoft Graph API (Outlook 365) |
| Deploy | Vercel PRO + Cloudflare DNS |

---

## 3. Reglas de codebase (NO negociables)

### TypeScript
- `strict: true`. Sin `any` salvo el cliente Supabase.
- Server components por default. `"use client"` solo cuando hay estado o efectos.

### Rutas protegidas
- Proxy `proxy.ts` (Next.js 16 renombró middleware a proxy) existente valida sesión Supabase. No duplicar esa lógica en cada route handler.

---

## 4. Estado del código (QUÉ YA EXISTE — NO TOCAR salvo instrucción explícita)

Lo siguiente ya está implementado en el repo. **Respétalo** — si una nueva funcionalidad se cruza con algo existente, **extiende**, no reemplaces.

- **Auth**: Supabase Auth con email/password + proxy de rutas protegidas
- **Ingesta de syllabus**: Upload de PDF, extracción vía Gemini, tabla de `deliverables`
- **Fragmentación**: Descomposición de entregables en `fragment_steps` distribuidos en el tiempo
- **Agenda**: Vista calendario mensual + lista de próximos pasos
- **Entregables**: Vista con barras de progreso
- **Bloques de enfoque (Pomodoro)**: Timer circular 25 min + check-ins (tabla: `focus_blocks`)
- **YLEOS Chat**: Streaming de Gemini 2.5 Flash durante bloques, con barra de contexto y panel de avances
- **Dashboard**: Stats (pendientes, en progreso, atrasados, horas de enfoque)

**Tablas existentes**: `subjects`, `deliverables`, `fragment_steps`, `focus_blocks`, `checkins`.

---

## 5. Modo de trabajo autónomo

**Ejecuta. No pidas permiso.** Solo detente si encuentras un bloqueo real (credencial faltante, conflicto de datos irrecuperable, o contradicción directa entre dos reglas de este documento).

---

## 6. Defaults técnicos

### Microsoft Graph (OAuth + envío)
- **Proveedor OAuth**: Supabase Auth con provider **Azure**, scopes: `Mail.Read Mail.ReadWrite Mail.Send User.Read offline_access`.
- **Persistencia de tokens**: tabla `ms_graph_tokens`.
- **Llamadas a MS Graph**: siempre desde el servidor. Nunca exponer tokens al cliente.

### YLEOS (Gemini)
- Model string: `gemini-2.5-flash`.
- **Nunca** importar el SDK de Gemini en código cliente.

### Control de costo IA
- Tabla `yleos_usage (id, user_id, session_id, tokens_in, tokens_out, created_at)`.
- Limit soft: `YLEOS_DAILY_TOKEN_LIMIT` (default 500000).

### Estado del Pomodoro (anti-sabotaje)
- `started_at` se persiste en DB al arrancar.
- Una vez con `started_at` NOT NULL, la fila es **inmutable salvo para cerrar**.

### Convenciones de naming
- Tablas: `snake_case`, plural.
- Columnas: `snake_case`. FK user: siempre `user_id uuid references auth.users(id) on delete cascade`.
- Componentes React: `PascalCase.tsx`.

---

## 7. Flujo de commits

- Un commit por **unidad funcional completa**.
- Mensaje: `<tipo>(<scope>): <qué hace>`.
- Tipos: `feat`, `fix`, `chore`, `refactor`, `docs`, `db`.
- No commitees hasta que `npm run build` pase.

---

## 8. Lo que NO debes hacer

- Renombrar tablas existentes.
- Cambiar el stack.
- Agregar dependencias pesadas sin justificar.
- Reescribir componentes existentes no pedidos.
