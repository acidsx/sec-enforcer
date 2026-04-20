"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { subjectColors } from "@/lib/subject-color";
import { createClient } from "@/lib/supabase/client";

interface HoyViewProps {
  greeting: string;
  userName: string;
  initialModoSugerido: boolean;
  rankedFull: any[];
}

export function HoyView({
  greeting,
  userName,
  initialModoSugerido,
  rankedFull,
}: HoyViewProps) {
  const [modoSugerido, setModoSugerido] = useState(initialModoSugerido);
  const supabase = createClient();

  async function toggleModo() {
    const next = !modoSugerido;
    setModoSugerido(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          hoy_modo_sugerido: next,
          updated_at: new Date().toISOString(),
        });
    }
  }

  const todayLabel = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (rankedFull.length === 0) {
    return <EmptyState greeting={greeting} userName={userName} todayLabel={todayLabel} />;
  }

  const focusItem = rankedFull[0];
  const others = rankedFull.slice(1);
  const focusStep = getFirstPendingStep(focusItem.full);

  return (
    <div className="space-y-10">
      {/* Header with toggle */}
      <div className="riseup flex items-start justify-between gap-4">
        <div>
          <p className="label">Hoy · {todayLabel}</p>
          <h1 className="display mt-2" style={{ textTransform: "capitalize" }}>
            {greeting}, {userName}
          </h1>
        </div>
        <ToggleRow checked={modoSugerido} onChange={toggleModo} />
      </div>

      {modoSugerido ? (
        <>
          {/* Focus card */}
          {focusStep && <FocusCard item={focusItem} step={focusStep} />}

          {/* Otros entregables como cards compactos */}
          {others.length > 0 && (
            <div className="riseup delay-1100">
              <p className="label mb-3">
                O trabaja en otra cosa ·{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {others.length} entregable{others.length !== 1 ? "s" : ""} activo
                  {others.length !== 1 ? "s" : ""}
                </span>
              </p>
              <div className="grid gap-2">
                {others.map((item: any) => (
                  <CompactCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Modo OFF: todos al mismo nivel */}
          <div className="riseup delay-300">
            <h2 className="mb-4" style={{ fontSize: "22px" }}>
              ¿En qué trabajamos hoy?
            </h2>
            <div className="grid gap-2">
              {rankedFull.map((item: any) => (
                <CompactCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="riseup" style={{ animationDelay: "1400ms" }}>
        <Link
          href="/planificar"
          className="caption"
          style={{ color: "var(--text-secondary)" }}
        >
          Ver todo el semestre →
        </Link>
      </div>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="caption" style={{ color: "var(--text-secondary)" }}>
        Modo sugerido
      </span>
      <button
        onClick={onChange}
        className="relative rounded-full transition-all shrink-0"
        style={{
          width: "36px",
          height: "20px",
          backgroundColor: checked
            ? "var(--accent-primary)"
            : "var(--bg-muted)",
        }}
      >
        <span
          className="absolute rounded-full transition-all"
          style={{
            top: "3px",
            left: checked ? "19px" : "3px",
            width: "14px",
            height: "14px",
            backgroundColor: "#fff",
          }}
        />
      </button>
    </div>
  );
}

function FocusCard({ item, step }: { item: any; step: any }) {
  const deliverable = item.full;
  const colors = subjectColors(deliverable?.subject?.color);
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
  const currentFase = fases.find((f: any) => !f.completada_at);

  return (
    <div className="riseup delay-600">
      <p className="label mb-3">
        Sugerido por YLEOS{" "}
        <span style={{ color: "var(--text-tertiary)", textTransform: "none", letterSpacing: 0 }}>
          · por urgencia + peso del entregable
        </span>
      </p>
      <div
        className="focus-card"
        style={{
          ["--subject-color" as any]: colors.main,
          borderRadius: "18px",
          padding: "22px 24px",
        }}
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

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="caption">{completedSteps} de {totalSteps} pasos</span>
            <span className="caption mono">{Math.round(progress)}%</span>
          </div>
          <div className="progress">
            <div className="progress__fill" style={{ width: `${progress}%`, ["--subject-color" as any]: colors.main }} />
          </div>
        </div>

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
                  <div className="phase-chip__num">{isDone ? "✓" : f.orden}</div>
                  <span className="phase-chip__label">{f.nombre}</span>
                </div>
              );
            })}
          </div>
        )}

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

function CompactCard({ item }: { item: any }) {
  const deliverable = item.full;
  if (!deliverable) return null;
  const colors = subjectColors(deliverable.subject?.color);
  const firstStep = getFirstPendingStep(deliverable);
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
  const href = firstStep ? `/focus/new?stepId=${firstStep.id}` : "#";

  return (
    <div
      className="card card__banded flex items-center gap-4"
      style={{
        ["--subject-color" as any]: colors.main,
        padding: "12px 16px 12px 20px",
        borderRadius: "12px",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="subject-dot" style={{ ["--subject-color" as any]: colors.main }} />
          <span className="label" style={{ color: colors.fg }}>
            {deliverable.subject?.name || "Sin asignatura"}
          </span>
        </div>
        <p
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: 500,
            marginTop: "2px",
          }}
        >
          {deliverable.title}
        </p>
        <p className="caption mt-0.5">
          <span className="mono">{deliverable.due_date}</span>
          <span
            style={{
              color: daysLeft <= 3 ? "var(--urgent)" : "var(--text-tertiary)",
            }}
          >
            {" "}
            · {daysLeft <= 0 ? "vencido" : `${daysLeft} días`}
          </span>
        </p>
      </div>
      <Link
        href={href}
        className="btn btn-secondary btn-sm shrink-0"
      >
        Trabajar
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function getFirstPendingStep(deliverable: any) {
  if (!deliverable) return null;
  const steps = (deliverable.fragment_steps || []).sort(
    (a: any, b: any) => a.step_number - b.step_number
  );
  return steps.find((s: any) => !s.completed) || null;
}

function EmptyState({
  greeting,
  userName,
  todayLabel,
}: {
  greeting: string;
  userName: string;
  todayLabel: string;
}) {
  return (
    <div className="space-y-10">
      <div className="riseup">
        <p className="label">Hoy · {todayLabel}</p>
        <h1 className="display mt-2" style={{ textTransform: "capitalize" }}>
          {greeting}, {userName}
        </h1>
      </div>
      <div
        className="card riseup delay-600 text-center"
        style={{ padding: "var(--space-16) var(--space-8)" }}
      >
        <h2>Empecemos con tu primer syllabus</h2>
        <p className="caption mt-3" style={{ maxWidth: "440px", margin: "var(--space-3) auto 0" }}>
          Sube un PDF de evaluación y YLEOS lo analiza, identifica trampas de la rúbrica y arma tu plan de trabajo.
        </p>
        <Link href="/planificar" className="btn btn-primary mt-6">
          Subir syllabus
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
