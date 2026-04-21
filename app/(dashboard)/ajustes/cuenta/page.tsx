import { createClient } from "@/lib/supabase/server";
import { CuentaView } from "./CuentaView";

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return <CuentaView user={user} />;
}
