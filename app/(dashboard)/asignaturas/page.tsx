import { createClient } from "@/lib/supabase/server";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export default async function AsignaturasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*, deliverables(id, title, due_date, status, fragment_steps(completed))")
    .eq("user_id", user!.id)
    .order("orden", { ascending: true });

  const active = (subjects || []).filter((s: any) => !s.archivada);
  const archived = (subjects || []).filter((s: any) => s.archivada);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asignaturas</h1>
          <p className="mt-1 text-muted">{active.length} ramo{active.length !== 1 ? "s" : ""} activo{active.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/intake"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dim transition"
        >
          <Plus className="h-4 w-4" />
          Nueva Asignatura
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">Sin asignaturas. Crea una al subir un entregable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((s: any) => {
            const totalSteps = s.deliverables?.reduce(
              (acc: number, d: any) => acc + (d.fragment_steps?.length || 0), 0
            ) || 0;
            const completedSteps = s.deliverables?.reduce(
              (acc: number, d: any) =>
                acc + (d.fragment_steps?.filter((st: any) => st.completed).length || 0), 0
            ) || 0;
            const nextDeadline = s.deliverables
              ?.filter((d: any) => d.status !== "completed")
              .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0];
            const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

            return (
              <Link
                key={s.id}
                href={`/asignaturas/${s.id}`}
                className="rounded-xl border border-border bg-surface overflow-hidden hover:border-muted transition"
              >
                <div className="h-2" style={{ backgroundColor: s.color || "#3E5C76" }} />
                <div className="p-5">
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.profesor && <p className="text-xs text-muted mt-0.5">{s.profesor}</p>}
                  {nextDeadline && (
                    <p className="text-xs text-muted mt-2">
                      Próxima entrega: {nextDeadline.title} · {nextDeadline.due_date}
                    </p>
                  )}
                  {totalSteps > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span>{completedSteps} de {totalSteps} pasos</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: s.color || "#3E5C76" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-8">
          <summary className="text-sm text-muted cursor-pointer">
            Asignaturas archivadas ({archived.length})
          </summary>
          <div className="mt-2 space-y-2">
            {archived.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface px-4 py-2 opacity-60">
                <span className="text-sm">{s.name}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
