import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "./push-server";
import { sendUrgentEmail } from "./email";

export type NotificationKind =
  | "deadline_proximo"
  | "deadline_hoy"
  | "atraso_critico"
  | "atraso_serio"
  | "atraso_leve"
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
  url?: string;
}): Promise<string | null> {
  const supabase = await createClient();

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

  if (error || !data) return null;

  // Dispatch to other channels based on priority and user prefs
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("notif_browser_enabled, notif_email_enabled")
    .eq("user_id", params.userId)
    .maybeSingle();

  const priority = params.priority || "normal";
  const isUrgent = priority === "urgent" || priority === "high";

  // Browser push: only for urgent/high
  if (prefs?.notif_browser_enabled && isUrgent) {
    try {
      await sendPushToUser(params.userId, {
        title: params.title,
        body: params.body || "",
        url: params.url || "/",
      });
      await supabase
        .from("notifications")
        .update({ dispatched_browser_at: new Date().toISOString() })
        .eq("id", data.id);
    } catch {}
  }

  // Email: only urgent, immediate. Normal → digest (handled by cron)
  if (prefs?.notif_email_enabled && priority === "urgent") {
    const { data: userData } = await supabase.auth.admin
      .getUserById(params.userId)
      .catch(() => ({ data: null }));
    const email = (userData as any)?.user?.email;
    if (email) {
      const sent = await sendUrgentEmail({
        to: email,
        title: params.title,
        body: params.body || "",
        url: params.url
          ? `https://sec.sx-finance.com${params.url}`
          : "https://sec.sx-finance.com",
      });
      if (sent) {
        await supabase
          .from("notifications")
          .update({ dispatched_email_at: new Date().toISOString() })
          .eq("id", data.id);
      }
    }
  }

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
