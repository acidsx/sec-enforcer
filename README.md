# SEC — Sistema de Ejecución y Control

Plataforma de gestión académica con ingesta de syllabus, fragmentación de entregables en pasos ejecutables, y bloques de enfoque con Pomodoro timer.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Deploy**: Vercel + Cloudflare DNS

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials
npm run dev
```

### Database

Run `supabase/schema.sql` in your Supabase SQL Editor to create the tables.

### Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Domain

Production: `sec.sx-finance.com`
