import { createClient } from "@/lib/supabase/server";
import { subjectColors } from "@/lib/subject-color";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function HoyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load all active deliverables with subject, fases, steps
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(`
      *,
      subject:subjects(name, color),
      fases(id, orden, nombre, completada_at, fragment_steps(id, completed, scheduled_date)),
      fragment_steps(id, completed, title, description, scheduled_date, step_number, fase_id)
    `)
    .eq("user_id", user!.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  const items = deliverables || [];

  // Determine focus: first non-completed step of highest-priority deliverable
  let focusDeliverable: any = null;
  let focusStep: any = null;

  for (const d of items) {
    const steps = (d.fragment_steps || []).sort(
      (a: any, b: any) => a.step_number - b.step_number
    );
    const nextStep = steps.find((s: any) => !s.completed);
    if (nextStep) {
      focusDeliverable = d;
      focusStep = nextStep;
      break;
    }
  }

  const greeting = getGreeting();
  const userName =
    user?.email?.split("@")[0]?.replace(/[._]/g, " ") || "estudiante";

  // Build "later" cards (other active deliverables, max 3)
  const laterCards = items
    .filter((d: any) => d.id !== focusDeliverable?.id)
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="riseup">
        <p className="label">Hoy · {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="display mt-2" style={{ textTransform: "capitalize" }}>
          {greeting}, {userName}
        </h1>
      </div>

      {/* Focus card */}
      {focusDeliverable && focusStep ? (
        <FocusCard deliverable={focusDeliverable} step={focusStep} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <AllDoneCard />
      )}

      {/* Later this week */}
      {laterCards.length > 0 && (
        <div className="riseup delay-1100">
          <p className="label mb-4">Más tarde esta semana</p>
          <div className="grid gap-3">
            {laterCards.map((d: any) => (
              <LaterCard key={d.id} deliverable={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FocusCard({ deliverable, step }: { deliverable: any; step: any }) {
  const colors = subjectColors(deliverable.subject?.color);
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
  const fases = (deliverable.fases || []).sort(
    (a: any, b: any) => a.orden - b.orden
  );
  const allSteps = deliverable.fragment_steps || [];
  const completedSteps = allSteps.filter((s: any) => s.completed).length;
  const totalSteps = allSteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Find current fase
  const currentFase = fases.find((f: any) => !f.completada_at);

  return (
    <div className="riseup delay-600">
      <p className="label mb-3">Foco ahora</p>
      <div
        className="focus-card"
        style={{ ["--subject-color" as any]: colors.main }}
      >
        <div className="focus-card__band" />

        <div className="flex items-center gap-2 mb-3">
          <span
            className="subject-dot subject-dot--pulse"
            style={{ ["--subject-color" as any]: colors.main }}
          />
          <span className="label" style={{ color: colors.fg }}>
            {deliverable.subject?.name || "Sin asignatura"}
          </span>
        </div>

        <h2 className="serif" style={{ fontSize: "26px", fontWeight: 500, lineHeight: 1.25 }}>
          {step.title}
        </h2>
        {step.description && (
          <p className="mt-3 caption" style={{ maxWidth: "640px", lineHeight: 1.6 }}>
            {step.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-5 caption">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            <span className="mono">{deliverable.due_date}</span>
            <span style={{ color: daysLeft <= 3 ? "var(--urgent)" : "var(--text-tertiary)" }}>
              · {daysLeft <= 0 ? "vencido" : `${daysLeft} días`}
            </span>
          </span>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="caption">{completedSteps} de {totalSteps} pasos</span>
            <span className="caption mono">{Math.round(progress)}%</span>
          </div>
          <div className="progress">
            <div className="progress__fill" style={{ width: `${progress}%`, ["--subject-color" as any]: colors.main }} />
          </div>
        </div>

        {/* Phase chips */}
        {fases.length > 0 && (
          <div className="flex gap-2 mt-6">
            {fases.map((f: any) => {
              const isDone = !!f.completada_at;
              const isActive = !isDone && f.id === currentFase?.id;
              return (
                <div
                  key={f.id}
                  className={`phase-chip ${isDone ? "phase-chip--done" : ""} ${isActive ? "phase-chip--active" : ""}`}
                  style={{
                    ["--subject-color" as any]: colors.main,
                    ["--subject-bg" as any]: colors.bg,
                  }}
                >
                  <div className="phase-chip__num">
                    {isDone ? "✓" : f.orden}
                  </div>
                  <span className="phase-chip__label">{f.nombre}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 mt-8">
          <Link
            href={`/focus/new?stepId=${step.id}`}
            className="btn btn-primary btn-lg"
            style={{ backgroundColor: colors.main }}
          >
            Empezar sesión de 25 min
            <ArrowRight size={16} />
          </Link>
          <Link href="/planificar" className="btn btn-ghost">
            Otro
          </Link>
        </div>
      </div>
    </div>
  );
}

function LaterCard({ deliverable }: { deliverable: any }) {
  const colors = subjectColors(deliverable.subject?.color);
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/entregar/${deliverable.id}`}
      className="card card--clickable card__banded flex items-center justify-between"
      style={{
        ["--subject-color" as any]: colors.main,
        paddingLeft: "var(--space-8)",
        paddingTop: "var(--space-5)",
        paddingBottom: "var(--space-5)",
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="subject-dot" style={{ ["--subject-color" as any]: colors.main }} />
          <span className="label" style={{ color: colors.fg }}>
            {deliverable.subject?.name}
          </span>
        </div>
        <p className="mt-1" style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>
          {deliverable.title}
        </p>
      </div>
      <div className="text-right caption">
        <p className="mono">{deliverable.due_date}</p>
        <p style={{ color: daysLeft <= 3 ? "var(--urgent)" : "var(--text-tertiary)" }}>
          {daysLeft <= 0 ? "vencido" : `${daysLeft} días`}
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card riseup delay-600 text-center" style={{ padding: "var(--space-16) var(--space-8)" }}>
      <h2>Empecemos con tu primer syllabus</h2>
      <p className="caption mt-3" style={{ maxWidth: "440px", margin: "var(--space-3) auto 0" }}>
        Sube un PDF de evaluación y YLEOS lo analiza, identifica trampas de la rúbrica y arma tu plan de trabajo.
      </p>
      <Link href="/planificar" className="btn btn-primary mt-6">
        Subir syllabus
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function AllDoneCard() {
  return (
    <div className="card riseup delay-600 text-center" style={{ padding: "var(--space-16) var(--space-8)" }}>
      <h2>Todo al día</h2>
      <p className="caption mt-3">No hay pasos pendientes hoy. Buen momento para planificar lo que viene.</p>
      <Link href="/planificar" className="btn btn-secondary mt-6">
        Ver semestre
      </Link>
    </div>
  );
}
