import { createClient } from "@/lib/supabase/server";
import { markAsRead } from "@/lib/notifications/dispatcher";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const limit = Number(request.nextUrl.searchParams.get("limit")) || 10;
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.is("read_at", null);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Count unread
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return Response.json({ notifications: data, unreadCount: count || 0 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    return Response.json({ ok: true });
  }

  if (notificationId) {
    await markAsRead(notificationId, user.id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "notificationId o markAllRead requerido" }, { status: 400 });
}
