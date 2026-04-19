"use client";

import { useState } from "react";
import type { Deliverable } from "@/types/database";
import {
  Loader2,
  CheckCircle,
  FileText,
  ChevronRight,
  Layers,
} from "lucide-react";

interface YleosProcessorProps {
  subjectId: string;
  file: File | null;
  onComplete: () => void;
}

type ProcessState = "idle" | "ingesting" | "ingested" | "fragmenting" | "done";

export function YleosProcessor({
  subjectId,
  file,
  onComplete,
}: YleosProcessorProps) {
  const [state, setState] = useState<ProcessState>("idle");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleIngest() {
    if (!file) return;
    setState("ingesting");
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      const res = await fetch("/api/yleos/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileBase64: base64,
          subjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setState("idle");
        return;
      }

      setDeliverables(data.deliverables);
      setState("ingested");
    };
    reader.readAsDataURL(file);
  }

  async function handleFragmentAll() {
    setState("fragmenting");
    setError(null);

    for (const d of deliverables) {
      const res = await fetch("/api/yleos/fragment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: d.id,
          title: d.title,
          dueDate: d.due_date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        setState("ingested");
        return;
      }
    }

    setState("done");
    onComplete();
  }

  const typeLabels: Record<string, string> = {
    informe: "Informe",
    presentacion: "Presentación",
    codigo: "Código",
    ensayo: "Ensayo",
    examen: "Examen",
    tarea: "Tarea",
  };

  return (
    <div className="space-y-4">
      {/* Process button */}
      {state === "idle" && file && (
        <button
          onClick={handleIngest}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dim transition"
        >
          <Layers className="h-4 w-4" />
          Procesar Syllabus
        </button>
      )}

      {/* Loading state */}
      {state === "ingesting" && (
        <div className="flex items-center gap-3 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Procesando PDF con YLEOS...</span>
        </div>
      )}

      {/* Results */}
      {(state === "ingested" || state === "fragmenting" || state === "done") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">
              {deliverables.length} entregables detectados
            </span>
          </div>

          <div className="space-y-2">
            {deliverables.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3"
              >
                <FileText className="h-4 w-4 text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted">
                    {typeLabels[d.type] || d.type} · {d.weight}% ·{" "}
                    {d.due_date}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted shrink-0" />
              </div>
            ))}
          </div>

          {state === "ingested" && (
            <button
              onClick={handleFragmentAll}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dim transition"
            >
              <Layers className="h-4 w-4" />
              Fragmentar Entregables
            </button>
          )}

          {state === "fragmenting" && (
            <div className="flex items-center gap-3 text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Fragmentando entregables...</span>
            </div>
          )}

          {state === "done" && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Todos los entregables han sido fragmentados en pasos ejecutables.
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
