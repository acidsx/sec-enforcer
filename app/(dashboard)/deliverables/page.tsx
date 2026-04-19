import { createClient } from "@/lib/supabase/server";
import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendiente", color: "text-blue-400", icon: Clock },
  in_progress: { label: "En Progreso", color: "text-yellow-400", icon: Clock },
  completed: { label: "Completado", color: "text-green-400", icon: CheckCircle },
  overdue: { label: "Atrasado", color: "text-red-400", icon: AlertTriangle },
};

const typeLabels: Record<string, string> = {
  informe: "Informe",
  presentacion: "Presentación",
  codigo: "Código",
  ensayo: "Ensayo",
  examen: "Examen",
  tarea: "Tarea",
};

export default async function DeliverablesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, fragment_steps(*), subject:subjects(name)")
    .eq("user_id", user!.id)
    .order("due_date", { ascending: true });

  const items = deliverables || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entregables</h1>
        <p className="mt-1 text-muted">
          {items.length} entregable{items.length !== 1 ? "s" : ""} registrado
          {items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <FileText className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">
            Sin entregables. Ve a Ingesta para procesar un syllabus.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d: any) => {
            const isOverdue =
              d.status !== "completed" && new Date(d.due_date) < new Date();
            const effectiveStatus = isOverdue ? "overdue" : d.status;
            const cfg = statusConfig[effectiveStatus] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const stepsCount = d.fragment_steps?.length || 0;
            const stepsCompleted =
              d.fragment_steps?.filter((s: any) => s.completed).length || 0;

            return (
              <div
                key={d.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{d.title}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
                      <span>{typeLabels[d.type] || d.type}</span>
                      <span>Peso: {d.weight}%</span>
                      <span>Entrega: {d.due_date}</span>
                      {d.subject && <span>{d.subject.name}</span>}
                    </div>
                    {d.description && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">
                        {d.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {stepsCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>
                        {stepsCompleted}/{stepsCount} pasos completados
                      </span>
                      <span>
                        {Math.round((stepsCompleted / stepsCount) * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${(stepsCompleted / stepsCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
