import { createClient } from "@/lib/supabase/server";
import { computeFocus } from "@/lib/hoy/compute-focus";
import { HoyView } from "./HoyView";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function HoyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const focusResult = await computeFocus(user.id, supabase);

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("hoy_modo_sugerido")
    .eq("user_id", user.id)
    .maybeSingle();

  const modoSugerido = prefs?.hoy_modo_sugerido ?? true;

  const { data: deliverablesRaw } = await supabase
    .from("deliverables")
    .select(`
      *,
      subject:subjects(name, color),
      fases(id, orden, nombre, completada_at),
      fragment_steps(id, completed, title, description, scheduled_date, step_number, fase_id)
    `)
    .eq("user_id", user.id)
    .neq("status", "completed");

  const fullById = Object.fromEntries(
    (deliverablesRaw || []).map((d: any) => [d.id, d])
  );

  const rankedFull =
    focusResult?.rankedList.map((r) => ({
      ...r,
      full: fullById[r.id],
    })) || [];

  const greeting = getGreeting();
  const userName =
    user.email?.split("@")[0]?.replace(/[._]/g, " ") || "estudiante";

  return (
    <HoyView
      greeting={greeting}
      userName={userName}
      initialModoSugerido={modoSugerido}
      rankedFull={rankedFull}
    />
  );
}
