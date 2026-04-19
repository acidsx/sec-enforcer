import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const role = await getUserRole(user.id);
  return Response.json({ role });
}
