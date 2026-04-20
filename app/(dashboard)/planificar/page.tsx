import { createClient } from "@/lib/supabase/server";
import { subjectColors } from "@/lib/subject-color";
import { Upload, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";

export default async function PlanificarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, subject:subjects(name, color), fragment_steps(id, completed)")
    .eq("user_id", user!.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  const items = deliverables || [];
  const today = new Date();

  // Week load calculation (next 8 weeks)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekItems = items.filter((d: any) => {
      const due = new Date(d.due_date);
      return due >= weekStart && due <= weekEnd;
    });

    const totalWeight = weekItems.reduce(
      (acc: number, d: any) => acc + (d.weight || 10),
      0
    );

    let density: "empty" | "light" | "moderate" | "high" | "peak" = "empty";
    if (totalWeight === 0) density = "empty";
    else if (totalWeight < 15) density = "light";
    else if (totalWeight < 30) density = "moderate";
    else if (totalWeight < 50) density = "high";
    else density = "peak";

    return {
      label: `S${i + 1}`,
      date: weekStart,
      count: weekItems.length,
      weight: totalWeight,
      density,
    };
  });

  const densityColors: Record<string, string> = {
    empty: "var(--bg-muted)",
    light: "var(--subject-7)",
    moderate: "var(--subject-3)",
    high: "var(--accent-warning)",
    peak: "var(--subject-4)",
  };

  // Upcoming 4 weeks deliverables
  const fourWeeks = new Date(today);
  fourWeeks.setDate(fourWeeks.getDate() + 28);
  const upcoming = items.filter(
    (d: any) => new Date(d.due_date) <= fourWeeks
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="riseup">
        <p className="label">Momento planificar</p>
        <h1 className="mt-2" style={{ fontSize: "36px" }}>
          Tu semestre, a vista de pájaro
        </h1>
        <p className="caption mt-2">
          {items.length} entregables activos en las próximas 8 semanas
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 riseup delay-200">
        <Link href="/intake" className="btn btn-primary">
          <Upload size={16} />
          Subir syllabus
        </Link>
        <button className="btn btn-secondary">
          <Bot size={16} />
          Revisar carga con YLEOS
        </button>
      </div>

      {/* Week load grid */}
      <div className="riseup delay-300">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Carga por semana</p>
          <div className="flex gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: densityColors.light }} /> Liviana
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: densityColors.moderate }} /> Media
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: densityColors.peak }} /> Pico
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-6)" }}>
          <div className="flex items-end gap-2" style={{ height: "120px" }}>
            {weeks.map((w, i) => {
              const maxWeight = Math.max(...weeks.map((x) => x.weight), 10);
              const heightPct = (w.weight / maxWeight) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(heightPct, 8)}%`,
                      background: densityColors[w.density],
                      transition: `height 0.6s cubic-bezier(.2,.9,.3,1) ${i * 80}ms`,
                      minHeight: "8px",
                    }}
                    title={`${w.count} entregables · peso ${w.weight}%`}
                  />
                  <span className="caption mono" style={{ fontSize: "10px" }}>
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="riseup delay-600">
        <p className="label mb-4">Próximos entregables</p>
        {upcoming.length === 0 ? (
          <div className="card text-center" style={{ padding: "var(--space-12)" }}>
            <p className="caption">Sin entregables próximos. Ve a Ingesta para comenzar.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((d: any) => (
              <DeliverableRow key={d.id} deliverable={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliverableRow({ deliverable }: { deliverable: any }) {
  const colors = subjectColors(deliverable.subject?.color);
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
  const steps = deliverable.fragment_steps || [];
  const completed = steps.filter((s: any) => s.completed).length;
  const total = steps.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const isUrgent = daysLeft <= 3;

  return (
    <Link
      href={`/entregar/${deliverable.id}`}
      className="card card--clickable card__banded"
      style={{
        ["--subject-color" as any]: colors.main,
        padding: "var(--space-5) var(--space-6) var(--space-5) var(--space-8)",
      }}
    >
      <div className="flex items-center gap-6">
        <div style={{ minWidth: "100px" }}>
          <p className="caption mono">{deliverable.due_date}</p>
          <p className="caption" style={{ color: isUrgent ? "var(--urgent)" : "var(--text-tertiary)" }}>
            {daysLeft <= 0 ? "vencido" : `${daysLeft}d`}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="subject-dot" style={{ ["--subject-color" as any]: colors.main }} />
            <span className="label" style={{ color: colors.fg }}>
              {deliverable.subject?.name}
            </span>
          </div>
          <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>{deliverable.title}</p>
          <div className="flex gap-2 mt-2">
            {deliverable.weight > 0 && (
              <span className="chip">{deliverable.weight}%</span>
            )}
            {isUrgent && <span className="chip chip--urgent">Urgente</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="mono caption">{completed}/{total}</p>
          <div style={{ width: "64px" }}>
            <div className="progress mt-1">
              <div
                className="progress__fill"
                style={{ width: `${progress}%`, ["--subject-color" as any]: colors.main }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
