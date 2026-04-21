"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

export async function updatePreference(key: string, value: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      [key]: value,
      updated_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function updateMultiplePreferences(updates: Record<string, any>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleFeatureFlag(flagKey: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  try {
    await requireAdmin(user.id);
  } catch {
    return { ok: false, error: "NOT_AUTHORIZED" };
  }

  const { error } = await supabase
    .from("feature_flags")
    .update({
      enabled,
      status: enabled ? "on" : "off",
      updated_at: new Date().toISOString(),
    })
    .eq("flag_key", flagKey);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/ajustes/admin");
  return { ok: true };
}
