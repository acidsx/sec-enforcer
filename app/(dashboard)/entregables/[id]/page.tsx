"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trophy,
  ArrowLeft,
  Crosshair,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Fase {
  id: string;
  nombre: string;
  tipo: string | null;
  orden: number;
  completada_at: string | null;
  fragment_steps: Step[];
}

interface Step {
  id: string;
  title: string;
  description: string | null;
  step_number: number;
  scheduled_date: string;
  completed: boolean;
}

export default function RoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [fases, setFases] = useState<Fase[]>([]);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  useEffect(() => {
    async function load() {
      // Load deliverable
      const delRes = await fetch("/api/deliverables");
      const delData = await delRes.json();
      const del = delData.deliverables?.find((d: any) => d.id === id);
      setDeliverable(del);

      if (del?.subject) {
        setSubject(del.subject);
      }

      // Load fases
      const fasesRes = await fetch(`/api/fases?deliverableId=${id}`);
      const fasesData = await fasesRes.json();
      setFases(
        (fasesData.fases || []).map((f: any) => ({
          ...f,
          fragment_steps: (f.fragment_steps || []).sort(
            (a: any, b: any) => a.step_number - b.step_number
          ),
        }))
      );

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const allComplete = fases.every((f) => f.completada_at);
  const subjectColor = subject?.color || "#3E5C76";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={deliverable?.subject_id ? `/asignaturas/${deliverable.subject_id}` : "/deliverables"}
            className="text-muted hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-muted">
              {subject?.name || "Asignatura"} · Mapa del Entregable
            </p>
            <h1 className="text-xl font-bold">{deliverable?.title}</h1>
          </div>
        </div>
        {deliverable?.due_date && (
          <div className="text-sm text-muted">
            Entrega: <span className="font-medium text-foreground">{deliverable.due_date}</span>
          </div>
        )}
      </div>

      {/* Roadmap horizontal */}
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {fases.map((fase, fi) => {
          const completedSteps = fase.fragment_steps.filter((s) => s.completed).length;
          const totalSteps = fase.fragment_steps.length;
          const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

          return (
            <div key={fase.id} className="flex items-start gap-2" style={{ scrollSnapAlign: "start" }}>
              <div
                className="w-80 shrink-0 rounded-xl border bg-surface overflow-hidden"
                style={{ borderColor: fase.completada_at ? subjectColor : "var(--border)" }}
              >
                {/* Fase header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: fase.completada_at ? subjectColor : "transparent",
                        border: `2px solid ${subjectColor}`,
                        color: fase.completada_at ? "#fff" : subjectColor,
                      }}
                    >
                      {fase.completada_at ? "✓" : fi + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{fase.nombre}</p>
                      {fase.tipo && (
                        <p className="text-[10px] text-muted uppercase tracking-wider">
                          {fase.tipo}
                        </p>
                      )}
                    </div>
                    {fase.completada_at && (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--ok)" }} />
                    )}
                  </div>
                  {totalSteps > 0 && (
                    <div className="mt-2 h-1 w-full rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: subjectColor }}
                      />
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="px-3 py-3 space-y-2">
                  {fase.fragment_steps.map((step) => {
                    const isOverdue = !step.completed && step.scheduled_date < today;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step)}
                        className={`w-full text-left rounded-lg px-3 py-2.5 transition ${
                          step.completed
                            ? "bg-surface-2/50"
                            : isOverdue
                              ? "border-2 bg-surface"
                              : "bg-surface border border-border hover:border-muted"
                        }`}
                        style={{
                          borderColor: isOverdue ? "var(--urgent)" : undefined,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--ok)" }} />
                          ) : isOverdue ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--urgent)" }} />
                          ) : (
                            <Circle className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${step.completed ? "line-through text-muted" : ""}`}>
                              {step.title}
                            </p>
                            {step.description && (
                              <p className="text-xs text-muted truncate mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Arrow between fases */}
              {fi < fases.length - 1 && (
                <div className="flex items-center pt-12">
                  <ChevronRight className="h-5 w-5 text-muted/30" />
                </div>
              )}
            </div>
          );
        })}

        {/* Final column — entregable status */}
        <div className="w-40 shrink-0 flex flex-col items-center justify-center text-center py-8" style={{ scrollSnapAlign: "start" }}>
          <Trophy
            className="h-10 w-10 mb-2"
            style={{ color: allComplete ? "var(--medal-gold, #B8924A)" : "var(--text-muted)", opacity: allComplete ? 1 : 0.3 }}
          />
          <p className={`text-sm font-medium ${allComplete ? "" : "text-muted"}`}>
            {allComplete ? "Entregable completado" : "Entrega pendiente"}
          </p>
        </div>
      </div>

      {/* Step detail drawer */}
      {selectedStep && (
        <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-border shadow-xl z-40 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedStep.title}</h3>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-muted hover:text-foreground text-sm"
              >
                Cerrar
              </button>
            </div>

            {selectedStep.description && (
              <p className="text-sm text-muted leading-relaxed">
                {selectedStep.description}
              </p>
            )}

            <p className="text-xs text-muted">
              Programado: {selectedStep.scheduled_date}
            </p>

            {!selectedStep.completed && (
              <Link
                href={`/focus/new?stepId=${selectedStep.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-dim transition"
              >
                <Crosshair className="h-4 w-4" />
                Iniciar sesión de trabajo
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
