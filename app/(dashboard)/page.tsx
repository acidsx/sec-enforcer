import { createClient } from "@/lib/supabase/server";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crosshair,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch data in parallel
  const [deliverablesRes, focusBlocksRes, stepsRes] = await Promise.all([
    supabase
      .from("deliverables")
      .select("*")
      .eq("user_id", user!.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("focus_blocks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("status", "completed"),
    supabase
      .from("fragment_steps")
      .select("*")
      .eq("user_id", user!.id)
      .eq("completed", false)
      .order("scheduled_date", { ascending: true })
      .limit(5),
  ]);

  const deliverables = deliverablesRes.data || [];
  const completedBlocks = focusBlocksRes.data || [];
  const upcomingSteps = stepsRes.data || [];

  const pending = deliverables.filter((d) => d.status === "pending").length;
  const inProgress = deliverables.filter(
    (d) => d.status === "in_progress"
  ).length;
  const overdue = deliverables.filter((d) => {
    return d.status !== "completed" && new Date(d.due_date) < new Date();
  }).length;
  const totalMinutes = completedBlocks.reduce(
    (acc, b) => acc + (b.planned_minutes || 0),
    0
  );

  const stats = [
    {
      label: "Entregables Pendientes",
      value: pending,
      icon: FileText,
      color: "text-blue-400",
    },
    {
      label: "En Progreso",
      value: inProgress,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      label: "Atrasados",
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      label: "Horas de Enfoque",
      value: `${(totalMinutes / 60).toFixed(1)}h`,
      icon: Crosshair,
      color: "text-green-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted">Sistema de Ejecución y Control</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="text-sm text-muted">{s.label}</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Steps */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Pasos</h2>
        {upcomingSteps.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <CheckCircle className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-muted">
              No hay pasos pendientes. Ingesta un syllabus para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
                  {step.step_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{step.title}</p>
                  <p className="text-xs text-muted">{step.scheduled_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
