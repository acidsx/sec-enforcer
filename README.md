# SEC — Sistema de Ejecución y Control

Plataforma de gestión académica que combina ingesta de syllabus (PDF o manual), fragmentación de entregables en pasos ejecutables, bloques de enfoque Pomodoro de 25 minutos, y asistencia en tiempo real con **YLEOS** — una IA táctica basada en Gemini que guía al alumno, evita la procrastinación y genera avances concretos durante cada sesión.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase PRO (PostgreSQL + Auth + RLS)
- **AI**: Google Gemini 2.5 Flash (YLEOS — prompt propietario)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Deploy**: Vercel PRO + Cloudflare DNS

## Funcionalidades

- **Auth**: Login/registro con Supabase Auth, proxy middleware para rutas protegidas
- **Ingesta de Entregables**: Subir PDF de syllabus (YLEOS analiza y extrae entregables con Gemini) o entrada manual con fechas definidas por el usuario
- **Fragmentación**: Cada entregable se descompone en pasos ejecutables distribuidos en el tiempo
- **Agenda**: Vista calendario mensual con indicadores de pasos pendientes/completados + lista de próximos pasos con urgencia por días restantes
- **Entregables**: Vista de todos los entregables con barras de progreso por pasos completados
- **Bloques de Enfoque**: Pomodoro de 25 min con timer circular + check-ins de estado de ánimo y progreso
- **YLEOS Chat**: Chat en vivo con IA durante bloques de enfoque — barra de contexto (paso, deadline, progreso), panel de avances de sesión, streaming en tiempo real
- **Dashboard**: Stats en tiempo real (pendientes, en progreso, atrasados, horas de enfoque)

## Setup

```bash
npm install
cp .env.example .env.local
# Configurar credenciales de Supabase y Gemini
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
        ├── Supabase PRO (DB + Auth)
        └── Gemini 2.5 Flash (YLEOS AI)
```

## Domain

Production: `sec.sx-finance.com`
