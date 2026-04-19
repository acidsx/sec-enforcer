# SEC — Sistema de Ejecución y Control

Plataforma de gestión académica que combina ingesta inteligente de evaluaciones (PDF o manual), generación automática de planes de trabajo, bloques de enfoque Pomodoro de 25 minutos, y asistencia en tiempo real con **YLEOS** — una IA táctica basada en Gemini que comprende la evaluación completa, guía al alumno paso a paso, produce avances concretos y confronta la procrastinación.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase PRO (PostgreSQL + Auth + RLS)
- **AI**: Google Gemini 2.5 Flash (YLEOS — prompt propietario)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Deploy**: Vercel PRO + Cloudflare DNS

## Flujo Principal

```
1. Subir PDF de evaluación
2. YLEOS analiza: identifica tareas, rúbrica, formato, criterios
3. Genera plan de trabajo con pasos concretos para nota máxima
4. Alumno define fechas de entrega
5. Pasos se distribuyen en calendario
6. Alumno inicia bloque de enfoque (25 min)
7. YLEOS acompaña en chat: redacta, investiga, estructura
8. Check-in al finalizar → siguiente paso
```

## Funcionalidades

### Ingesta Inteligente
- **Subir PDF**: YLEOS analiza la evaluación completa con Gemini — extrae instrucciones, entregables, requisitos de formato, criterios de evaluación de la rúbrica y genera un plan de trabajo con pasos ejecutables diseñados para sesiones de 25 min
- **Entrada manual**: Definir entregables y fechas manualmente
- **Validación**: Fechas pasadas bloqueadas

### YLEOS — Asistente Táctico
- Chat en vivo durante bloques de enfoque con streaming en tiempo real
- **Contexto completo**: YLEOS conoce las instrucciones de la evaluación, el plan de trabajo completo, pasos completados/pendientes, deadline y progreso — trabaja directamente sin pedir archivos
- **Panel de avances**: Registra automáticamente los avances generados durante cada sesión
- **Barra de contexto**: Paso actual, días restantes, progreso %
- **Anti-procrastinación**: Confronta al alumno si divaga o pierde foco

### Gestión Académica
- **Dashboard**: Stats en tiempo real (pendientes, en progreso, atrasados, horas de enfoque)
- **Agenda**: Vista calendario mensual con indicadores por día + lista de próximos pasos con urgencia (colores según días restantes)
- **Entregables**: Vista con barras de progreso por pasos completados
- **Bloques de Enfoque**: Pomodoro 25 min con timer circular + check-ins de estado de ánimo y progreso

### Auth & Seguridad
- Login/registro con Supabase Auth
- Proxy middleware (Next.js 16) para rutas protegidas
- Row Level Security en todas las tablas

## Setup

```bash
npm install
cp .env.example .env.local
# Configurar credenciales
npm run dev
```

### Database

Ejecutar `supabase/schema.sql` en Supabase SQL Editor para crear las tablas con RLS.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
GEMINI_API_KEY=tu-gemini-api-key
```

## Arquitectura

```
sec.sx-finance.com (Cloudflare DNS)
  └── Vercel PRO (build + hosting)
        ├── Next.js 16 (App Router)
        ├── Supabase PRO (DB + Auth + RLS)
        └── Gemini 2.5 Flash (YLEOS AI)
```

## Domain

Production: `sec.sx-finance.com`
