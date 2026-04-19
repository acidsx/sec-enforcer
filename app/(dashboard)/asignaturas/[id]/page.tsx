import { createClient } from "@/lib/supabase/server";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function AsignaturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!subject) {
    return <div className="p-6 text-muted">Asignatura no encontrada.</div>;
  }

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, fragment_steps(completed), fases(id, nombre, completada_at, orden)")
    .eq("subject_id", id)
    .order("due_date", { ascending: true });

  const items = deliverables || [];
  const activos = items.filter((d: any) => d.status !== "completed");
  const entregados = items.filter((d: any) => d.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl overflow-hidden border border-border bg-surface">
        <div className="h-8" style={{ backgroundColor: subject.color || "#3E5C76" }} />
        <div className="p-6">
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <div className="flex gap-3 mt-1 text-sm text-muted">
            {subject.profesor && <span>{subject.profesor}</span>}
            {subject.semestre && <span>· {subject.semestre}</span>}
            {subject.code && <span>· {subject.code}</span>}
          </div>
        </div>
      </div>

      {/* Active deliverables */}
      {activos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Activos</h2>
          <div className="space-y-3">
            {activos.map((d: any) => {
              const totalSteps = d.fragment_steps?.length || 0;
              const completedSteps = d.fragment_steps?.filter((s: any) => s.completed).length || 0;
              const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
              const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / (1000*60*60*24));
              const fases = (d.fases || []).sort((a: any, b: any) => a.orden - b.orden);

              return (
                <Link
                  key={d.id}
                  href={`/entregables/${d.id}`}
                  className="block rounded-xl border border-border bg-surface p-5 hover:border-muted transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{d.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Entrega: {d.due_date} ·{" "}
                        <span className={daysLeft <= 3 ? "text-red-400 font-medium" : daysLeft <= 7 ? "text-yellow-400" : ""}>
                          {daysLeft <= 0 ? "Vencido" : `${daysLeft} días`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Mini roadmap — circles per fase */}
                  {fases.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {fases.map((f: any, i: number) => (
                        <div key={f.id} className="flex items-center gap-1">
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: f.completada_at ? (subject.color || "#3E5C76") : "transparent",
                              border: `2px solid ${subject.color || "#3E5C76"}`,
                              color: f.completada_at ? "#fff" : (subject.color || "#3E5C76"),
                            }}
                          >
                            {f.completada_at ? "✓" : i + 1}
                          </div>
                          {i < fases.length - 1 && (
                            <div className="w-4 h-0.5 bg-border" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {totalSteps > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: subject.color || "#3E5C76" }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed deliverables */}
      {entregados.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted">Entregados</h2>
          <div className="space-y-2 opacity-60">
            {entregados.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm line-through">{d.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
