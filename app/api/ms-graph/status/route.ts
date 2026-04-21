import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ connected: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data } = await supabase
    .from("ms_graph_tokens")
    .select("user_id, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    connected: !!data,
    expires_at: data?.expires_at || null,
  });
}
