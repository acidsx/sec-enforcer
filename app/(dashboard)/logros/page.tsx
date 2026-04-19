import { createClient } from "@/lib/supabase/server";
import { Award, Trophy, CheckCircle2, BookOpenCheck, Medal } from "lucide-react";

const iconMap: Record<string, typeof Award> = {
  primera_asignatura: BookOpenCheck,
  primer_entregable: Award,
  fase_completada: CheckCircle2,
  entregable_completado: Trophy,
  semestre_completado: Medal,
};

export default async function LogrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: logros } = await supabase
    .from("logros")
    .select("*")
    .eq("user_id", user!.id)
    .order("otorgado_at", { ascending: false });

  const items = logros || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logros</h1>
        <p className="mt-1 text-muted">
          {items.length} logro{items.length !== 1 ? "s" : ""} obtenido{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Trophy className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">
            Aún no tienes logros. Se otorgan al completar fases, entregables y más.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((logro: any) => {
            const Icon = iconMap[logro.tipo] || Award;
            return (
              <div
                key={logro.id}
                className="rounded-xl border border-border bg-surface p-5 flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{logro.titulo}</p>
                  {logro.subtitulo && (
                    <p className="text-xs text-muted mt-0.5">{logro.subtitulo}</p>
                  )}
                  <p className="text-[10px] text-muted mt-1">
                    {new Date(logro.otorgado_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
