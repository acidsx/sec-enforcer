import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { AjustesSidebar } from "@/components/ajustes/AjustesSidebar";

export default async function AjustesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? await getUserRole(user.id) : "student";

  return (
    <div className="space-y-8">
      <div className="riseup">
        <p className="label">Ajustes</p>
        <h1 className="mt-2" style={{ fontSize: "36px" }}>
          Tu cuenta y preferencias
        </h1>
      </div>

      <div
        className="flex gap-8"
        style={{ alignItems: "flex-start" }}
      >
        <AjustesSidebar role={role} />
        <div className="flex-1 min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
