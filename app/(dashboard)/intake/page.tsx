"use client";

import { useState, useEffect } from "react";
import { PdfDropzone } from "@/components/intake/PdfDropzone";
import {
  Plus,
  Trash2,
  Loader2,
  Layers,
  CheckCircle,
  Upload,
  PenLine,
  Bot,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface DeliverableForm {
  title: string;
  type: string;
  dueDate: string;
  weight: number;
  description: string;
}

const emptyDeliverable: DeliverableForm = {
  title: "",
  type: "tarea",
  dueDate: "",
  weight: 0,
  description: "",
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
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
    setFile(selectedFile);
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

      if (data.deliverables?.length) {
        setDeliverables(
          data.deliverables.map((d: any) => ({
            title: d.title || "",
            type: d.type || "tarea",
            dueDate: "",
            weight: d.weight || 0,
            description: d.description || "",
          }))
        );
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(selectedFile);
  }

  function updateDeliverable(
    index: number,
    field: string,
    value: string | number
  ) {
    setDeliverables((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function addDeliverable() {
    setDeliverables((prev) => [...prev, { ...emptyDeliverable }]);
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

    for (const d of saveData.deliverables) {
      const fragRes = await fetch("/api/yleos/fragment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: d.id,
          title: d.title,
          dueDate: d.due_date,
        }),
      });
      if (!fragRes.ok) {
        const fragData = await fragRes.json();
        setError(fragData.error);
        setFragmenting(false);
        return;
      }
    }

    setFragmenting(false);
    setDone(true);
  }

  function resetAll() {
    setDeliverables([]);
    setFile(null);
    setMode("choose");
    setDone(false);
    setError(null);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ingesta de Entregables
        </h1>
        <p className="mt-1 text-muted">
          Sube un syllabus PDF o define entregables manualmente. YLEOS los
          fragmentará en pasos ejecutables.
        </p>
      </div>

      {/* Subject selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Asignatura</label>
        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground focus:border-accent focus:outline-none"
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
            className="flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </button>
        </div>

        {showNewSubject && (
          <form
            onSubmit={createSubject}
            className="flex gap-2 rounded-lg border border-border bg-surface p-3"
          >
            <input
              type="text"
              placeholder="Nombre de la asignatura"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Código (opt.)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={subjectLoading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim transition disabled:opacity-50"
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
                YLEOS analiza tu syllabus y extrae entregables
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              setMode("manual");
              setDeliverables([{ ...emptyDeliverable }]);
            }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-8 hover:border-accent hover:bg-accent/5 transition"
          >
            <PenLine className="h-8 w-8 text-accent" />
            <div className="text-center">
              <p className="font-semibold">Entrada Manual</p>
              <p className="text-xs text-muted mt-1">
                Define entregables con fechas manualmente
              </p>
            </div>
          </button>
        </div>
      )}

      {/* PDF Mode */}
      {selectedSubject && mode === "pdf" && !done && deliverables.length === 0 && (
        <div className="space-y-4">
          <PdfDropzone onFileSelected={handlePdfAnalyze} />

          {analyzing && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
              <Bot className="h-5 w-5 text-accent animate-pulse" />
              <div>
                <p className="font-medium text-sm">YLEOS analizando PDF...</p>
                <p className="text-xs text-muted">
                  Extrayendo entregables del syllabus
                </p>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-muted ml-auto" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Deliverables editor (both modes) */}
      {selectedSubject && deliverables.length > 0 && !done && (
        <div className="space-y-4">
          {mode === "pdf" && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>
                YLEOS detectó {deliverables.length} entregable
                {deliverables.length !== 1 ? "s" : ""}. Define las fechas de
                entrega:
              </span>
            </div>
          )}

          <h2 className="text-lg font-semibold">Entregables</h2>

          {deliverables.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Entregable {i + 1}
                </span>
                {deliverables.length > 1 && (
                  <button
                    onClick={() => removeDeliverable(i)}
                    className="text-muted hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Título del entregable"
                value={d.title}
                onChange={(e) => updateDeliverable(i, "title", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                required
              />

              <div className="grid grid-cols-3 gap-3">
                <select
                  value={d.type}
                  onChange={(e) => updateDeliverable(i, "type", e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={d.dueDate}
                  min={today}
                  onChange={(e) =>
                    updateDeliverable(i, "dueDate", e.target.value)
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                  required
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

              <textarea
                placeholder="Descripción (opcional)"
                value={d.description}
                onChange={(e) =>
                  updateDeliverable(i, "description", e.target.value)
                }
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none resize-none"
              />
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
                  {saving ? "Guardando..." : "Fragmentando..."}
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Guardar y Fragmentar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manual mode with no deliverables yet */}
      {selectedSubject &&
        mode === "manual" &&
        deliverables.length === 0 &&
        !done && (
          <button
            onClick={addDeliverable}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted hover:border-muted hover:text-foreground transition w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            Agregar entregable
          </button>
        )}

      {/* Done state */}
      {done && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
          <p className="font-semibold">Entregables creados y fragmentados</p>
          <p className="text-sm text-muted">
            Ve a la Agenda para ver tus pasos programados e iniciar un bloque de
            enfoque con YLEOS.
          </p>
          <button onClick={resetAll} className="text-sm text-accent hover:underline">
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
