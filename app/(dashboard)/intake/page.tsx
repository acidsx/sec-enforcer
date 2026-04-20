"use client";

import { useState, useEffect } from "react";
import { PdfDropzone } from "@/components/intake/PdfDropzone";
import { SECDatePicker } from "@/components/ui/SECDatePicker";
import {
  Plus,
  Trash2,
  Loader2,
  Layers,
  CheckCircle,
  Upload,
  PenLine,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Target,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface StepForm {
  title: string;
  description: string;
  estimatedMinutes?: number;
  faseOrden?: number;
  faseNombre?: string;
}

interface FaseForm {
  orden: number;
  nombre: string;
  tipo: string;
  steps: StepForm[];
}

interface DeliverableForm {
  title: string;
  type: string;
  dueDate: string;
  weight: number;
  description: string;
  fases: FaseForm[];
  steps: StepForm[];
  expanded: boolean;
}

interface AnalysisResult {
  assignment: {
    title: string;
    subject: string;
    weight: number;
    summary: string;
  };
  deliverables: any[];
  format_requirements: string;
  evaluation_criteria: string[];
}

const emptyDeliverable: DeliverableForm = {
  title: "",
  type: "tarea",
  dueDate: "",
  weight: 0,
  description: "",
  fases: [],
  steps: [],
  expanded: true,
};

const typeOptions = [
  { value: "informe", label: "Informe" },
  { value: "presentacion", label: "Presentación" },
  { value: "codigo", label: "Código" },
  { value: "ensayo", label: "Ensayo" },
  { value: "examen", label: "Examen" },
  { value: "tarea", label: "Tarea" },
];

const today = new Date().toISOString().split("T")[0];

export default function IntakePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [subjectLoading, setSubjectLoading] = useState(false);

  const [mode, setMode] = useState<"choose" | "pdf" | "manual">("choose");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [deliverables, setDeliverables] = useState<DeliverableForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [fragmenting, setFragmenting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    if (res.ok) setSubjects(data.subjects);
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubjectLoading(true);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubjects((prev) => [data.subject, ...prev]);
      setSelectedSubject(data.subject.id);
      setShowNewSubject(false);
      setNewName("");
      setNewCode("");
    }
    setSubjectLoading(false);
  }

  async function handlePdfAnalyze(selectedFile: File) {
    setAnalyzing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      const res = await fetch("/api/yleos/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: selectedFile.name,
          mimeType: "application/pdf",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al analizar el PDF");
        setAnalyzing(false);
        return;
      }

      setAnalysis(data);

      if (data.deliverables?.length) {
        setDeliverables(
          data.deliverables.map((d: any) => {
            const fases: FaseForm[] = (d.fases || []).map((f: any) => ({
              orden: f.orden ?? 0,
              nombre: f.nombre || "",
              tipo: f.tipo || "general",
              steps: (f.steps || []).map((s: any) => ({
                title: s.title || s.titulo || "",
                description: s.description || s.descripcion || "",
                estimatedMinutes: s.estimatedMinutes || s.tiempo_estimado || 25,
              })),
            }));
            return {
              title: d.title || "",
              type: d.type || "tarea",
              dueDate: "",
              weight: d.weight || 0,
              description: d.description || "",
              fases,
              steps: fases.flatMap((f) =>
                f.steps.map((s) => ({
                  ...s,
                  faseOrden: f.orden,
                  faseNombre: f.nombre,
                }))
              ),
              expanded: false,
            };
          })
        );
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(selectedFile);
  }

  function updateDeliverable(
    index: number,
    field: string,
    value: string | number | boolean
  ) {
    setDeliverables((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function addDeliverable() {
    setDeliverables((prev) => [...prev, { ...emptyDeliverable, steps: [] }]);
  }

  function removeDeliverable(index: number) {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveAndFragment() {
    if (!selectedSubject) return;
    setError(null);

    const valid = deliverables.every((d) => d.title && d.dueDate);
    if (!valid) {
      setError("Cada entregable necesita título y fecha de entrega.");
      return;
    }

    const pastDate = deliverables.find((d) => d.dueDate < today);
    if (pastDate) {
      setError("Las fechas de entrega no pueden estar en el pasado.");
      return;
    }

    setSaving(true);

    // Save deliverables
    const saveRes = await fetch("/api/yleos/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: selectedSubject,
        manualDeliverables: deliverables.map((d) => ({
          title: d.title,
          type: d.type,
          dueDate: d.dueDate,
          weight: d.weight,
          description: d.description,
        })),
      }),
    });

    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      setError(saveData.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setFragmenting(true);

    // Persist fases and steps for each deliverable
    for (let i = 0; i < saveData.deliverables.length; i++) {
      const d = saveData.deliverables[i];
      const pdfFases = deliverables[i]?.fases;

      if (pdfFases && pdfFases.length > 0) {
        // Case 1: PDF analysis with structured fases — persist directly
        await fetch("/api/fases/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliverableId: d.id,
            fases: pdfFases,
          }),
        });
      } else {
        // Case 2: Manual entry — generate plan with Gemini (NO mock)
        const generated = await fetch("/api/yleos/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: d.title,
            description: deliverables[i]?.description || "",
            type: d.type,
            dueDate: d.due_date,
          }),
        });
        const generatedData = await generated.json();

        if (generated.ok && generatedData.fases?.length > 0) {
          await fetch("/api/fases/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deliverableId: d.id,
              fases: generatedData.fases,
            }),
          });
        } else {
          setError(
            "No pudimos generar el plan automáticamente. Edita manualmente."
          );
        }
      }
    }

    setFragmenting(false);
    setDone(true);
  }

  function distributeDate(
    dueDate: string,
    stepIndex: number,
    totalSteps: number
  ): string {
    const due = new Date(dueDate);
    const now = new Date();
    const totalDays = Math.max(
      1,
      Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const dayOffset = Math.floor(
      (totalDays * (stepIndex + 1)) / totalSteps
    );
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split("T")[0];
  }

  function resetAll() {
    setDeliverables([]);
    setAnalysis(null);
    setMode("choose");
    setDone(false);
    setError(null);
  }

  return (
    <div className="space-y-8" style={{ maxWidth: "720px" }}>
      <div className="riseup">
        <p className="label">Momento ingesta</p>
        <h1 className="mt-2">Ingesta de Entregables</h1>
        <p className="caption mt-2">
          Sube un PDF de evaluación o define entregables manualmente. YLEOS
          analiza, planifica y fragmenta.
        </p>
      </div>

      {/* Subject selection */}
      <div className="space-y-3 riseup delay-200">
        <label className="label">Asignatura</label>
        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `[${s.code}] ` : ""}
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewSubject(!showNewSubject)}
            className="btn btn-secondary"
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        {showNewSubject && (
          <form
            onSubmit={createSubject}
            className="flex gap-2 card"
            style={{ padding: "var(--space-3)" }}
          >
            <input
              type="text"
              placeholder="Nombre de la asignatura"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <input
              type="text"
              placeholder="Código"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              style={{ width: "100px" }}
            />
            <button
              type="submit"
              disabled={subjectLoading}
              className="btn btn-primary"
            >
              Crear
            </button>
          </form>
        )}
      </div>

      {/* Mode selection */}
      {selectedSubject && mode === "choose" && !done && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("pdf")}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-8 hover:border-accent hover:bg-accent/5 transition"
          >
            <Upload className="h-8 w-8 text-accent" />
            <div className="text-center">
              <p className="font-semibold">Subir PDF</p>
              <p className="text-xs text-muted mt-1">
                YLEOS analiza tu evaluación, identifica tareas y propone un plan
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              setMode("manual");
              setDeliverables([{ ...emptyDeliverable, steps: [] }]);
            }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-8 hover:border-accent hover:bg-accent/5 transition"
          >
            <PenLine className="h-8 w-8 text-accent" />
            <div className="text-center">
              <p className="font-semibold">Entrada Manual</p>
              <p className="text-xs text-muted mt-1">
                Define entregables y pasos manualmente
              </p>
            </div>
          </button>
        </div>
      )}

      {/* PDF Mode - Upload */}
      {selectedSubject &&
        mode === "pdf" &&
        !done &&
        deliverables.length === 0 && (
          <div className="space-y-4">
            <PdfDropzone onFileSelected={handlePdfAnalyze} />

            {analyzing && (
              <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <Bot className="h-5 w-5 text-accent animate-pulse" />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    YLEOS analizando evaluación...
                  </p>
                  <p className="text-xs text-muted">
                    Identificando tareas, criterios de evaluación y generando
                    plan de trabajo
                  </p>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

      {/* Analysis summary (after PDF analysis) */}
      {analysis && !done && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                YLEOS — Análisis de Evaluación
              </p>
              <p className="text-lg font-semibold mt-1">
                {analysis.assignment.title}
              </p>
              {analysis.assignment.subject && (
                <p className="text-xs text-muted">
                  {analysis.assignment.subject}
                  {analysis.assignment.weight > 0 &&
                    ` · Ponderación: ${analysis.assignment.weight}%`}
                </p>
              )}
              <p className="text-sm text-muted mt-2">
                {analysis.assignment.summary}
              </p>
            </div>
          </div>

          {analysis.format_requirements && (
            <div className="flex gap-2 text-xs bg-surface rounded-lg px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
              <span className="text-muted">
                {analysis.format_requirements}
              </span>
            </div>
          )}

          {analysis.evaluation_criteria &&
            analysis.evaluation_criteria.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Criterios de Evaluación
                </p>
                <div className="grid gap-1">
                  {analysis.evaluation_criteria.map((c, i) => (
                    <p key={i} className="text-xs text-muted flex gap-1.5">
                      <span className="text-accent">·</span>
                      {c}
                    </p>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Deliverables editor */}
      {selectedSubject && deliverables.length > 0 && !done && (
        <div className="space-y-4">
          {mode === "pdf" && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>
                Plan de trabajo generado: {deliverables.length} entregable
                {deliverables.length !== 1 ? "s" : ""} con{" "}
                {deliverables.reduce((acc, d) => acc + d.steps.length, 0)} pasos.
                Define las fechas de entrega:
              </span>
            </div>
          )}

          <h2 className="text-lg font-semibold">Entregables y Plan de Trabajo</h2>

          {deliverables.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Entregable {i + 1}
                  </span>
                  <div className="flex gap-2">
                    {d.steps.length > 0 && (
                      <button
                        onClick={() =>
                          updateDeliverable(i, "expanded", !d.expanded)
                        }
                        className="text-muted hover:text-foreground transition text-xs flex items-center gap-1"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {d.steps.length} pasos
                        {d.expanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    {deliverables.length > 1 && (
                      <button
                        onClick={() => removeDeliverable(i)}
                        className="text-muted hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Título del entregable"
                  value={d.title}
                  onChange={(e) =>
                    updateDeliverable(i, "title", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                  required
                />

                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={d.type}
                    onChange={(e) =>
                      updateDeliverable(i, "type", e.target.value)
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    {typeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <SECDatePicker
                    value={d.dueDate}
                    onChange={(v) => updateDeliverable(i, "dueDate", v)}
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Peso %"
                      value={d.weight || ""}
                      onChange={(e) =>
                        updateDeliverable(i, "weight", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                </div>

                {d.description && (
                  <p className="text-xs text-muted bg-surface-2 rounded-lg px-3 py-2">
                    {d.description}
                  </p>
                )}
              </div>

              {/* Steps (expandable) */}
              {d.expanded && d.steps.length > 0 && (
                <div className="border-t border-border bg-surface-2/50 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                    Plan de Trabajo
                  </p>
                  {d.steps.map((step, si) => (
                    <div
                      key={si}
                      className="flex gap-3 rounded-lg bg-surface px-3 py-2.5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0 mt-0.5">
                        {si + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addDeliverable}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted hover:border-muted hover:text-foreground transition w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            Agregar entregable
          </button>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
            >
              Volver
            </button>
            <button
              onClick={handleSaveAndFragment}
              disabled={saving || fragmenting}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dim transition disabled:opacity-50"
            >
              {saving || fragmenting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {saving ? "Guardando..." : "Creando plan de trabajo..."}
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Guardar y Crear Plan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
          <p className="font-semibold">Plan de trabajo creado</p>
          <p className="text-sm text-muted">
            Ve a la Agenda para ver tus pasos programados e iniciar un bloque de
            enfoque con YLEOS.
          </p>
          <button
            onClick={resetAll}
            className="text-sm text-accent hover:underline"
          >
            Agregar más entregables
          </button>
        </div>
      )}

      {!selectedSubject && (
        <p className="text-sm text-muted">
          Selecciona o crea una asignatura para continuar.
        </p>
      )}
    </div>
  );
}
