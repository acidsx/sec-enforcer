import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/dispatcher";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await Promise.allSettled([
    evaluateDeadlineNotifications(),
    evaluateLowProgressNotifications(),
  ]);

  return Response.json({
    results: results.map((r) =>
      r.status === "fulfilled" ? r.value : r.reason?.message
    ),
  });
}

async function evaluateDeadlineNotifications() {
  const supabase = await createClient();
  const today = new Date();

  // Get all active deliverables with deadline in next 7 days
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, fragment_steps(completed), subject:subjects(name)")
    .neq("status", "completed")
    .lte("due_date", sevenDaysOut.toISOString().split("T")[0])
    .gte("due_date", today.toISOString().split("T")[0]);

  let created = 0;

  for (const d of deliverables || []) {
    const total = d.fragment_steps?.length || 0;
    const completed = d.fragment_steps?.filter((s: any) => s.completed).length || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const daysLeft = Math.ceil(
      (new Date(d.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Decision matrix
    let shouldNotify = false;
    let priority: "low" | "normal" | "high" | "urgent" = "normal";

    if (daysLeft <= 0) {
      shouldNotify = true;
      priority = "urgent";
    } else if (daysLeft <= 1) {
      shouldNotify = true;
      priority = progress >= 70 ? "high" : "urgent";
    } else if (daysLeft <= 2) {
      shouldNotify = true;
      priority = progress < 30 ? "urgent" : progress < 70 ? "high" : "normal";
    } else if (daysLeft <= 3) {
      shouldNotify = progress < 70;
      priority = progress < 30 ? "high" : "normal";
    } else if (daysLeft <= 5) {
      shouldNotify = progress < 30;
      priority = "normal";
    }

    if (shouldNotify) {
      await createNotification({
        userId: d.user_id,
        kind: "deadline_proximo",
        title: `${d.title} — ${daysLeft <= 0 ? "vence hoy" : `${daysLeft} día${daysLeft > 1 ? "s" : ""}`}`,
        body: `Progreso: ${Math.round(progress)}%. ${d.subject?.name || ""}`,
        refId: d.id,
        refTable: "deliverables",
        priority,
      });
      created++;
    }
  }

  return { type: "deadline", created };
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
    .lte("due_date", fiveDaysOut.toISOString().split("T")[0]);

  let created = 0;

  for (const d of deliverables || []) {
    const total = d.fragment_steps?.length || 0;
    const completed = d.fragment_steps?.filter((s: any) => s.completed).length || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    if (progress < 25) {
      // Check if student had a session in last 48h
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
          title: `${d.title} tiene progreso bajo`,
          body: `Solo ${Math.round(progress)}% completado. Inicia una sesión para avanzar.`,
          refId: d.id,
          refTable: "deliverables",
          priority: "high",
        });
        created++;
      }
    }
  }

  return { type: "low_progress", created };
}
