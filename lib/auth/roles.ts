import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "student";

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return (data?.role as UserRole) || "student";
}

export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (role !== "admin") {
    throw new Error("NOT_AUTHORIZED: admin role required");
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "admin";
}
