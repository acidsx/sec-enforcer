import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/dispatcher";
import { sendDigestEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await Promise.allSettled([
    evaluateMatrixNotifications(),
    evaluateLowProgressNotifications(),
    dispatchEmailDigests(),
  ]);

  return Response.json({
    results: results.map((r) =>
      r.status === "fulfilled" ? r.value : r.reason?.message
    ),
  });
}

/**
 * Matriz de decisión:
 * días\progreso  <30%              30-70%           >70%
 *   >7 días      silencio          silencio         silencio
 *   3-7 días     progreso_bajo     silencio         silencio
 *   1-2 días     deadline_proximo  deadline_proximo silencio
 *   Hoy (0)      deadline_hoy ✨   deadline_hoy ✨  deadline_hoy
 *   Atrasado     atraso_critico ✨ atraso_serio ✨  atraso_leve
 * ✨ = urgent
 */
async function evaluateMatrixNotifications() {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Fetch all active deliverables (incluyendo atrasados)
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, fragment_steps(completed), subject:subjects(name)")
    .neq("status", "completed")
    .lte("due_date", sevenDaysOut.toISOString().split("T")[0]);

  let created = 0;

  for (const d of deliverables || []) {
    const total = d.fragment_steps?.length || 0;
    const completed = d.fragment_steps?.filter((s: any) => s.completed).length || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const daysLeft = Math.ceil(
      (new Date(d.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let kind: any = null;
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    let title = "";
    let body = `Progreso: ${Math.round(progress)}%. ${d.subject?.name || ""}`;

    if (daysLeft < 0) {
      // Atrasado
      if (progress < 30) {
        kind = "atraso_critico";
        priority = "urgent";
        title = `Crítico: ${d.title} atrasado ${Math.abs(daysLeft)}d sin avance`;
      } else if (progress < 70) {
        kind = "atraso_serio";
        priority = "urgent";
        title = `${d.title} atrasado ${Math.abs(daysLeft)} día${Math.abs(daysLeft) > 1 ? "s" : ""}`;
      } else {
        kind = "atraso_leve";
        priority = "high";
        title = `${d.title} atrasado ${Math.abs(daysLeft)}d (${Math.round(progress)}% hecho)`;
      }
    } else if (daysLeft === 0) {
      kind = "deadline_hoy";
      priority = "urgent";
      title = `${d.title} — vence hoy`;
    } else if (daysLeft <= 2) {
      if (progress < 70) {
        kind = "deadline_proximo";
        priority = progress < 30 ? "urgent" : "high";
        title = `${d.title} — ${daysLeft} día${daysLeft > 1 ? "s" : ""}`;
      }
    } else if (daysLeft <= 7 && progress < 30) {
      kind = "progreso_bajo";
      priority = "normal";
      title = `${d.title} sin avance, ${daysLeft} días restantes`;
    }

    if (kind) {
      await createNotification({
        userId: d.user_id,
        kind,
        title,
        body,
        refId: d.id,
        refTable: "deliverables",
        priority,
        url: `/entregar/${d.id}`,
      });
      created++;
    }
  }

  return { type: "matrix", created };
}

async function evaluateLowProgressNotifications() {
  const supabase = await createClient();
  const today = new Date();
  const fiveDaysOut = new Date(today);
  fiveDaysOut.setDate(fiveDaysOut.getDate() + 5);

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, fragment_steps(completed)")
    .neq("status", "completed")
    .lte("due_date", fiveDaysOut.toISOString().split("T")[0])
    .gte("due_date", today.toISOString().split("T")[0]);

  let created = 0;

  for (const d of deliverables || []) {
    const total = d.fragment_steps?.length || 0;
    const completed = d.fragment_steps?.filter((s: any) => s.completed).length || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    if (progress < 25) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      const { count } = await supabase
        .from("focus_blocks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", d.user_id)
        .gte("started_at", twoDaysAgo.toISOString());

      if ((count || 0) === 0) {
        await createNotification({
          userId: d.user_id,
          kind: "progreso_bajo",
          title: `${d.title}: sin sesiones en 48h`,
          body: `Solo ${Math.round(progress)}% completado. Inicia una sesión para avanzar.`,
          refId: d.id,
          refTable: "deliverables",
          priority: "high",
          url: `/entregar/${d.id}`,
        });
        created++;
      }
    }
  }

  return { type: "low_progress", created };
}

async function dispatchEmailDigests() {
  const supabase = await createClient();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Find notifications not yet emailed with priority normal/low from last 24h
  const { data: usersWithEmail } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("notif_email_enabled", true);

  let sent = 0;

  for (const up of usersWithEmail || []) {
    const { data: pending } = await supabase
      .from("notifications")
      .select("title, body, priority")
      .eq("user_id", up.user_id)
      .is("dispatched_email_at", null)
      .in("priority", ["low", "normal", "high"])
      .gte("created_at", yesterday.toISOString())
      .limit(10);

    if (!pending || pending.length === 0) continue;

    const { data: userData } = await supabase.auth.admin
      .getUserById(up.user_id)
      .catch(() => ({ data: null }));
    const email = (userData as any)?.user?.email;
    if (!email) continue;

    const ok = await sendDigestEmail({
      to: email,
      notifications: pending.map((n: any) => ({
        title: n.title,
        body: n.body,
        priority: n.priority,
      })),
    });

    if (ok) {
      await supabase
        .from("notifications")
        .update({ dispatched_email_at: new Date().toISOString() })
        .eq("user_id", up.user_id)
        .is("dispatched_email_at", null)
        .in("priority", ["low", "normal", "high"])
        .gte("created_at", yesterday.toISOString());
      sent++;
    }
  }

  return { type: "digest", sent };
}
