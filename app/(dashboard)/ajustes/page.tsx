import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { PerfilView } from "./PerfilView";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = await getUserRole(user.id);

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const [{ count: sc }, { count: dc }, { count: hc }] = await Promise.all([
    supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("archivada", false),
    supabase
      .from("deliverables")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "completed"),
    supabase
      .from("focus_blocks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("ended_at", "is", null),
  ]);

  const hoursApprox = Math.round(((hc || 0) * 25) / 60 * 10) / 10;

  return (
    <PerfilView
      user={user}
      role={role}
      prefs={prefs || {}}
      stats={{
        subjects: sc || 0,
        deliverables: dc || 0,
        hours: hoursApprox,
      }}
    />
  );
}
