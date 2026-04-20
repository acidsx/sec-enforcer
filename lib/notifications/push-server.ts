import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  )
    return;
  webpush.setVapidDetails(
    "mailto:andres.cidb@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  configureVapid();
  if (!vapidConfigured) return;

  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.allSettled(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh_key, auth: s.auth_key },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 410 Gone → subscription expired, remove
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
