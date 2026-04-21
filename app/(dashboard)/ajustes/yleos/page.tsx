import { createClient } from "@/lib/supabase/server";
import { YleosView } from "./YleosView";

export default async function YleosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: sessionsCount } = await supabase
    .from("focus_blocks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("ended_at", "is", null);

  const hours = Math.round(((sessionsCount || 0) * 25) / 60 * 10) / 10;

  return <YleosView prefs={prefs || {}} hoursWithYleos={hours} />;
}
