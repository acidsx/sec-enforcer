import { createClient } from "@/lib/supabase/server";
import { NotificacionesView } from "./NotificacionesView";

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return <NotificacionesView prefs={prefs || {}} />;
}
