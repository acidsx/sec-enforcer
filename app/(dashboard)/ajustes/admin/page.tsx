import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { notFound } from "next/navigation";
import { AdminView } from "./AdminView";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const role = await getUserRole(user.id);
  if (role !== "admin") notFound();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*")
    .order("flag_key");

  // Usage last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: usage } = await supabase
    .from("yleos_usage")
    .select("mode, tokens_in, tokens_out")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const usageByMode = (usage || []).reduce(
    (acc: any, u: any) => {
      const m = u.mode || "unknown";
      if (!acc[m]) acc[m] = { tokens: 0, count: 0 };
      acc[m].tokens += (u.tokens_in || 0) + (u.tokens_out || 0);
      acc[m].count += 1;
      return acc;
    },
    {}
  );

  return (
    <AdminView prefs={prefs || {}} flags={flags || []} usage={usageByMode} />
  );
}
