import { createClient } from "@/lib/supabase/server";

// Placeholder para Sprint 4 futuro. Por ahora retorna observation null
// para que Planificar no crashee y no renderice card vacía.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  return Response.json({ observation: null });
}
