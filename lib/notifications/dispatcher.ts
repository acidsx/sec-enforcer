import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "deadline_proximo"
  | "progreso_bajo"
  | "fase_completada_logro"
  | "entregable_completado_logro"
  | "sesion_sugerida"
  | "revisor_listo"
  | "sistema";

export async function createNotification(params: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  refId?: string;
  refTable?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}): Promise<string | null> {
  const supabase = await createClient();

  // Idempotency: check for duplicate in last 24h
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", params.userId)
    .eq("kind", params.kind)
    .eq("ref_id", params.refId || "")
    .gte("created_at", since.toISOString())
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      kind: params.kind,
      title: params.title,
      body: params.body || null,
      ref_id: params.refId || null,
      ref_table: params.refTable || null,
      priority: params.priority || "normal",
      dispatched_inapp_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id;
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count || 0;
}
