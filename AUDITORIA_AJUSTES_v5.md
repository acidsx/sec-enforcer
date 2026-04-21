# Auditoría Ajustes v5 vs Mockups originales

Fecha: 2026-04-21

## Resumen ejecutivo

- **Secciones completas**: 0/6
- **Secciones parciales**: 3/6 (Perfil, Notificaciones, Cuenta)
- **Secciones ausentes**: 3/6 (YLEOS, Apariencia, Panel Admin dedicado como subruta)
- **Subrutas `/ajustes/*`**: 0/6 implementadas. Todo está en una sola página monolítica `app/(dashboard)/ajustes/page.tsx`.
- **`components/ajustes/`**: no existe.

La implementación actual de Ajustes es **una sola página** con 5 cards apiladas verticalmente (Perfil, Notificaciones, Logros, Panel Admin condicional, Cuenta). No hay sidebar interno, no hay subrutas, no hay separación por secciones como define el mockup.

---

## Detalle por sección

### Perfil — **PARCIAL** ⚠️

- ❌ Card de identidad con avatar 64px, nombre, email, metadata completa, badge Admin
- ❌ Group "Identidad" con nombre completo, "cómo te llama YLEOS", email disabled
- ❌ Group "Contexto académico" con universidad, carrera, año, contexto laboral
- ❌ Card "Semestre actual" con título, fechas, barra bicolor animada, semana en curso
- ⚠️ Grid de 3 stats: asignaturas ✓, entregables ✓, **horas acumuladas** ❌ (muestra logros en lugar de horas)
- ❌ Group "Zona horaria y ubicación"
- ❌ Autosave visible (dot verde pulsante)

**Lo que sí está:**
- Card con email, rol, fecha "Desde [mes año]"
- 3 stats: asignaturas, entregables, logros (en vez de horas)

### Notificaciones — **PARCIAL** ⚠️

- ⚠️ 3 toggles en rows (no cards separados): In-app, Browser push, Email ✓ (funcionales)
- ❌ Cada card muestra status "Activo / Desactivado / Permiso concedido"
- ❌ Group "Horario de digest diario" con selector de hora
- ❌ Toggle "No enviar en fines de semana"
- ❌ **Matriz 5×3 "Qué se envía por qué canal"** — crítico
- ❌ Group "Comportamiento durante sesiones" con toggle silenciar
- ✓ Persistencia: `user_preferences` (verificado vía upsert)
- ✓ Browser push dispara permiso del navegador real

### YLEOS — **AUSENTE** ❌

**Todo ausente.** Solo aparece como sección dentro del Panel Admin como toggle de Acelerado, y eso es diferente.

- ❌ Hero con avatar YL + stat "X h juntos"
- ❌ Group "Tono" con 3 tiles (Cercano / Profesional / Formal)
- ❌ Quote de ejemplo que cambia según tono
- ❌ Group "Cadencia de preguntas" con slider
- ❌ Group "Comportamiento durante sesión" (reengage, checkpoints, micro-breaks)
- ❌ Group "Idioma del tutor"
- ❌ Group "Historial y memoria" con borrar memoria

### Apariencia — **AUSENTE** ❌

**Todo ausente.** No hay sección de apariencia en absoluto.

- ❌ Hero "SEC usa un tema único en light mode..."
- ❌ Group "Densidad" con 3 tiles con previews
- ❌ Group "Tonalidad del canvas" con 2 tiles
- ❌ Group "Tipografía del paso en sesión"
- ❌ Group "Tamaño de texto base" con slider
- ❌ Group "Animaciones" con 3 radios y demos
- ❌ Botón "Restaurar apariencia por defecto"
- ❌ Cambios se aplican globalmente

### Cuenta — **PARCIAL** ⚠️

- ❌ Group "Credenciales" (email disabled, contraseña, 2FA)
- ❌ Group "Sesiones activas" con lista de devices
- ❌ Botón "Cerrar todas las demás sesiones"
- ❌ Group "Exportar mis datos"
- ✓ Botón "Cerrar sesión" funcional
- ❌ Group "Zona de peligro" con archivar semestre + eliminar cuenta
- ❌ Danger card informativa al pie

**Lo que sí está:** solo un botón "Cerrar sesión" en una card simple.

### Panel Admin — **PARCIAL** ⚠️

- ⚠️ Guard `requireAdmin`: implementado via `role === "admin"` check en el render, **NO 404 para student** (student simplemente no ve el panel)
- ✓ Card con border-left coral + Shield icon + label "Panel de administrador"
- ⚠️ YLEOS Acelerado: toggle básico funcional ✓ pero **sin selector de temperatura** ❌
- ❌ Group "Uso de YLEOS · últimos 30 días" con 3 métricas (Analista, Tutor, Revisor)
- ❌ Group "Feature flags" con lista en mono + toggles
- ❌ Group "Módulo de correo Outlook" con badge "Standby"
- ❌ Group "Acciones destructivas" (purgar cache, re-ejecutar análisis)

---

## Hallazgos inesperados

1. **Sección "Logros recientes"** está implementada pero no aparece en el spec de mockups. Actualmente muestra los últimos 3 logros.
2. **`MenuAdmin` no está en subruta `/ajustes/admin`** — está condicionalmente rendererizado dentro de `/ajustes`. Esto significa:
   - No hay 404 para student al acceder a `/ajustes/admin` (la ruta no existe)
   - Si se espera que `requireAdmin` de server component bloquee la ruta, hay que crearla
3. **User_preferences tiene columnas** para: `yleos_accelerated_on`, `notif_inapp_enabled`, `notif_browser_enabled`, `notif_email_enabled`, `hoy_modo_sugerido`, `onboarding_asignaturas_dismissed`. Pero el mockup pide muchas más: `tono_yleos`, `cadencia_preguntas`, `idioma_yleos`, `densidad_ui`, `canvas_tono`, `tipografia_paso`, `tamano_texto`, `animaciones`, `zona_horaria`, `nombre_como_yleos_llama`, `universidad`, `carrera`, `ano_academico`, `keyboard_shortcuts_enabled`, `notif_email_digest_hour`, `notif_silent_in_session`.
4. **Matriz 5×3 de notificaciones** no existe. Tampoco hay esquema para mapear `kind` × `channel`.

---

## Recomendaciones para el prompt siguiente

### 1. **Crear las 5 subrutas reales** antes de cualquier otro feature
- `/ajustes/perfil` (o mantener `/ajustes` y agregar `/ajustes/identidad`, `/ajustes/contexto`)
- `/ajustes/notificaciones`
- `/ajustes/yleos`
- `/ajustes/apariencia`
- `/ajustes/cuenta`
- `/ajustes/admin` (con `requireAdmin` real en server → 404 para student)
- Layout interno con sidebar de 170px + content area
- Preservar la lógica actual de Perfil/Notificaciones/Admin que ya funciona.

### 2. **Migration amplia para `user_preferences`**
Agregar todas las columnas faltantes para que los mockups funcionen:
```sql
alter table user_preferences add column if not exists
  tono_yleos text default 'cercano' check (tono_yleos in ('cercano','profesional','formal')),
  cadencia_preguntas text default 'balanceada',
  idioma_yleos text default 'es-CL',
  memoria_sesiones_n int default 5,
  densidad_ui text default 'comoda' check (densidad_ui in ('compacta','comoda','espaciosa')),
  canvas_tono text default 'calido' check (canvas_tono in ('calido','puro')),
  tipografia_paso text default 'serif' check (tipografia_paso in ('serif','sans')),
  tamano_texto int default 100,
  animaciones text default 'completas' check (animaciones in ('completas','reducidas','ninguna')),
  keyboard_shortcuts_enabled boolean default true,
  notif_email_digest_hour int default 7,
  notif_silent_in_session boolean default true,
  zona_horaria text default 'America/Santiago',
  nombre_yleos_llama text,
  universidad text,
  carrera text,
  ano_academico text,
  contexto_laboral text;
```

### 3. **Matriz de notificaciones**
Crear tabla nueva `notification_channels` o extender `user_preferences` con un JSONB:
```sql
alter table user_preferences add column if not exists
  notif_matrix jsonb default '{}'::jsonb;
-- formato: {"deadline_proximo": {"inapp": true, "browser": true, "email": false}, ...}
```

### 4. **Crear directorio `components/ajustes/`** con componentes reutilizables:
- `IdentityCard.tsx`
- `SemesterCard.tsx`
- `NotifChannelCard.tsx`
- `NotifMatrix.tsx`
- `ToneTile.tsx`
- `DensityTile.tsx`
- `CanvasTile.tsx`
- `TypographyTile.tsx`
- `DangerZone.tsx`

### 5. Puntos del prompt de mejoras a ajustar por esta auditoría

- **E1 (atajos teclado)**: ya está implementado, pero **el toggle en Ajustes → Apariencia NO existe** porque Apariencia no existe. El toggle global está hardcoded a `true`. Hay que hacer que lea de `user_preferences.keyboard_shortcuts_enabled`.
- **F2-F5 (notificaciones)**: funcionan pero **la matriz 5×3 de Notificaciones no está**. Si el usuario quiere configurar "deadline_proximo solo por email pero no por push" no tiene cómo.
- **E3 (responsive)**: el layout actual de Ajustes ya es una sola columna scrolleable — eso funciona en mobile sin cambios. No aplica.
- **Todo lo demás (H1, PR1, F1)**: no se ven afectados por esta auditoría.

### 6. Alcance sugerido para un "Sprint Ajustes" futuro

Dos fases:
- **Fase A (bloque CRUD de datos)**: migration con columnas faltantes + server actions para leer/escribir prefs.
- **Fase B (UI)**: crear subrutas, layout con sidebar interno, componentes de tiles/cards, matriz de notificaciones.

Tiempo estimado: 6-8 horas (más que los puntos E1-E4 juntos).
