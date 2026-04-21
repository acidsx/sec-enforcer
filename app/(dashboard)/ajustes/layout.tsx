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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label">Ajustes</p>
            <h1 className="mt-2" style={{ fontSize: "36px" }}>
              Tu cuenta y preferencias
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 caption shrink-0 mt-2"
            style={{ color: "var(--accent-success)" }}
          >
            <span
              className="subject-dot subject-dot--pulse"
              style={{ ["--subject-color" as any]: "var(--accent-success)" }}
            />
            Guardado automático
          </div>
        </div>
        <p
          className="caption mt-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Los cambios se guardan al instante. Cierra sesión desde el menú lateral.
        </p>
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
