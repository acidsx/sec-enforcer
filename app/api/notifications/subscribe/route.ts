import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys, userAgent } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "subscription inválida" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        user_agent: userAgent || null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Also enable the notif pref
  await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, notif_browser_enabled: true });

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { endpoint } = body;

  if (endpoint) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
  }

  await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, notif_browser_enabled: false });

  return Response.json({ ok: true });
}
