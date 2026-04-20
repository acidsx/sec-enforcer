import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// v5 route redirects — deprecated views → moments
const ROUTE_REDIRECTS: Record<string, string> = {
  "/asignaturas": "/planificar",
  "/entregables": "/planificar",
  "/agenda": "/planificar",
  "/schedule": "/planificar",
  "/deliverables": "/planificar",
  "/logros": "/ajustes",
  "/notificaciones": "/",
  "/notifications": "/",
  "/ingesta": "/planificar",
  "/intake": "/planificar",
  "/mi-semana": "/",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth callback and login page without session
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // v5 redirects (exact match only — don't catch /asignaturas/[id])
  if (ROUTE_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(ROUTE_REDIRECTS[pathname], request.url));
  }

  // Create a Supabase client that reads cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Refresh the session cookies
  const response = NextResponse.next();
  const supabaseResponse = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  await supabaseResponse.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
