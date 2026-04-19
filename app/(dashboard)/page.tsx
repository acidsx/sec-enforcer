import { createClient } from "@/lib/supabase/server";
import {
  FileText,
  Clock,
  TrendingUp,
  Crosshair,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default async function MiSemanaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Load active deliverables with fases and steps
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, subject:subjects(name, color), fases(id, nombre, tipo, orden, completada_at, fragment_steps(id, completed)), fragment_steps(id, completed)")
    .eq("user_id", user!.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  const items = deliverables || [];

  // Load completed focus blocks this week
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const { count: sessionsThisWeek } = await supabase
    .from("focus_blocks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .gte("started_at", weekStart.toISOString());

  // Metrics
  const totalSteps = items.reduce((a, d: any) => a + (d.fragment_steps?.length || 0), 0);
  const completedSteps = items.reduce(
    (a, d: any) => a + (d.fragment_steps?.filter((s: any) => s.completed).length || 0), 0
  );
  const globalProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const nextDeadline = items[0];
  const nextDays = nextDeadline
    ? Math.ceil((new Date(nextDeadline.due_date).getTime() - Date.now()) / (1000*60*60*24))
    : null;

  // Build week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString("es-CL", { weekday: "short" }),
      day: d.getDate(),
      dateStr: d.toISOString().split("T")[0],
      isToday: d.toISOString().split("T")[0] === todayStr,
    };
  });

  const metrics = [
    { label: "Activos", value: items.length, sub: "entregables", icon: FileText },
    {
      label: "Próx. entrega",
      value: nextDays !== null ? `${nextDays}d` : "—",
      sub: nextDeadline ? (nextDeadline as any).title?.substring(0, 20) : "",
      icon: Clock,
      urgent: nextDays !== null && nextDays <= 3,
    },
    { label: "Progreso", value: `${globalProgress}%`, sub: `${completedSteps}/${totalSteps} pasos`, icon: TrendingUp },
    { label: "Sesiones", value: sessionsThisWeek || 0, sub: "esta semana", icon: Crosshair },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Mi semana
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {items.length} entregable{items.length !== 1 ? "s" : ""} activo{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Week bar */}
      <div
        className="flex gap-1 rounded-xl p-2"
        style={{ backgroundColor: "var(--bg-muted)" }}
      >
        {weekDays.map((d) => (
          <div
            key={d.dateStr}
            className="flex-1 text-center rounded-lg py-2 transition"
            style={{
              backgroundColor: d.isToday ? "var(--accent-primary)" : "transparent",
              color: d.isToday ? "#fff" : "var(--text-muted)",
            }}
          >
            <p className="text-[10px] uppercase font-medium">{d.label}</p>
            <p className="text-sm font-bold">{d.day}</p>
          </div>
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m: any) => (
          <div
            key={m.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--bg-muted)" }}
          >
            <div className="flex items-center gap-2">
              <m.icon
                className="h-4 w-4"
                style={{ color: m.urgent ? "var(--urgent)" : "var(--text-muted)" }}
              />
              <span
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </span>
            </div>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: m.urgent ? "var(--urgent)" : "var(--text-primary)" }}
            >
              {m.value}
            </p>
            {m.sub && (
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Flow cards */}
      <div>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Flujos activos
        </h2>

        {items.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}
          >
            <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>
              Sin entregables activos. Ve a Ingesta para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((d: any) => {
              const subjectColor = d.subject?.color || "#3E5C76";
              const daysLeft = Math.ceil(
                (new Date(d.due_date).getTime() - Date.now()) / (1000*60*60*24)
              );
              const dSteps = d.fragment_steps || [];
              const dCompleted = dSteps.filter((s: any) => s.completed).length;
              const dTotal = dSteps.length;
              const dProgress = dTotal > 0 ? Math.round((dCompleted / dTotal) * 100) : 0;
              const fases = (d.fases || []).sort((a: any, b: any) => a.orden - b.orden);

              return (
                <div
                  key={d.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--bg-muted)",
                  }}
                >
                  <div className="flex">
                    {/* Color band */}
                    <div className="w-1" style={{ backgroundColor: subjectColor }} />

                    <div className="flex-1 p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider font-semibold"
                            style={{ color: subjectColor }}
                          >
                            {d.subject?.name || "Sin asignatura"}
                          </p>
                          <h3
                            className="text-base font-semibold mt-0.5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {d.title}
                          </h3>
                        </div>
                        <Link
                          href={`/entregables/${d.id}`}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition shrink-0"
                          style={{
                            backgroundColor: subjectColor,
                            color: "#fff",
                          }}
                        >
                          Abrir con YLEOS
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Chips */}
                      <div className="flex gap-2 mt-2">
                        {d.weight > 0 && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
                          >
                            {d.weight}%
                          </span>
                        )}
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: daysLeft <= 3 ? "var(--urgent)" : daysLeft <= 7 ? "var(--warn)" : "var(--bg-muted)",
                            color: daysLeft <= 7 ? "#fff" : "var(--text-secondary)",
                          }}
                        >
                          {daysLeft <= 0 ? "Vencido" : `${daysLeft} días`}
                        </span>
                      </div>

                      {/* Fases horizontal */}
                      {fases.length > 0 && (
                        <div className="flex items-center gap-3 mt-4">
                          {fases.map((f: any, fi: number) => {
                            const fSteps = f.fragment_steps || [];
                            const fCompleted = fSteps.filter((s: any) => s.completed).length;
                            const isDone = !!f.completada_at;
                            const isActive = !isDone && fi === fases.findIndex((x: any) => !x.completada_at);

                            return (
                              <div key={f.id} className="flex items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <div
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{
                                      backgroundColor: isDone ? "var(--ok)" : isActive ? subjectColor : "var(--bg-muted)",
                                      color: isDone || isActive ? "#fff" : "var(--text-muted)",
                                      border: isActive ? `2px solid ${subjectColor}` : "none",
                                    }}
                                  >
                                    {isDone ? "✓" : fi + 1}
                                  </div>
                                  <span
                                    className="text-[9px] font-medium max-w-16 truncate text-center"
                                    style={{
                                      color: isDone ? "var(--ok)" : isActive ? "var(--text-primary)" : "var(--text-muted)",
                                      textDecoration: isDone ? "line-through" : "none",
                                    }}
                                  >
                                    {f.nombre}
                                  </span>
                                  {fSteps.length > 0 && (
                                    <div className="flex gap-0.5">
                                      {fSteps.map((s: any) => (
                                        <div
                                          key={s.id}
                                          className="h-1 w-2 rounded-full"
                                          style={{
                                            backgroundColor: s.completed ? "var(--ok)" : "var(--bg-muted)",
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {fi < fases.length - 1 && (
                                  <ChevronRight className="h-3 w-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Progress bar */}
                      {dTotal > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                            <span>{dCompleted}/{dTotal} pasos</span>
                            <span>{dProgress}%</span>
                          </div>
                          <div className="h-1 w-full rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${dProgress}%`, backgroundColor: subjectColor }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next session CTA */}
      {items.length > 0 && (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            backgroundColor: "var(--focus-bg)",
            border: "1px solid var(--bg-muted)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Próxima sesión sugerida
          </p>
          <p
            className="text-lg font-semibold mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            {(items[0] as any).title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {nextDays !== null && `${nextDays} días hasta entrega`}
          </p>
          <Link
            href={`/entregables/${(items[0] as any).id}`}
            className="inline-flex items-center gap-2 mt-4 rounded-lg px-6 py-3 font-semibold text-white transition"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Crosshair className="h-4 w-4" />
            Iniciar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
