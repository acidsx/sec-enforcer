"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Lightbulb, PenLine } from "lucide-react";

interface Checkpoint {
  id: string;
  concept: string;
  student_articulation: string;
}

interface ProgressPanelProps {
  sessionId: string;
}

export function ProgressPanel({ sessionId }: ProgressPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [advances, setAdvances] = useState<string[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [newAdvance, setNewAdvance] = useState("");
  const [showInput, setShowInput] = useState(false);

  // Poll checkpoints every 10s
  useEffect(() => {
    fetchCheckpoints();
    const interval = setInterval(fetchCheckpoints, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  async function fetchCheckpoints() {
    const res = await fetch(
      `/api/comprehension-checkpoints?sessionId=${sessionId}`
    );
    if (res.ok) {
      const data = await res.json();
      setCheckpoints(data.checkpoints || []);
    }
  }

  function addAdvance() {
    if (!newAdvance.trim()) return;
    setAdvances((prev) => [...prev, newAdvance.trim()]);
    setNewAdvance("");
    setShowInput(false);
  }

  return (
    <div
      className="border-t"
      style={{
        backgroundColor: "var(--focus-bg)",
        borderColor: "var(--bg-muted)",
      }}
    >
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-6 py-2.5 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Avances y comprensión</span>
        <div className="flex items-center gap-3">
          {advances.length > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] normal-case tracking-normal font-medium"
              style={{ color: "var(--ok)" }}
            >
              <PenLine className="h-3 w-3" />
              {advances.length} avance{advances.length !== 1 ? "s" : ""}
            </span>
          )}
          {checkpoints.length > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] normal-case tracking-normal font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              <Lightbulb className="h-3 w-3" />
              {checkpoints.length} concepto
              {checkpoints.length !== 1 ? "s" : ""}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-4 grid grid-cols-2 gap-6">
          {/* Advances */}
          <div>
            <p
              className="text-xs font-semibold mb-2 flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <PenLine className="h-3 w-3" />
              Avances producidos
            </p>
            <div className="space-y-1.5">
              {advances.map((a, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  · {a}
                </p>
              ))}
              {showInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdvance}
                    onChange={(e) => setNewAdvance(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addAdvance();
                    }}
                    placeholder="Describe tu avance..."
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--bg-muted)",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={addAdvance}
                    className="text-xs font-medium rounded-lg px-2.5 py-1.5"
                    style={{
                      backgroundColor: "var(--ok)",
                      color: "#fff",
                    }}
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowInput(true)}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--accent-primary)" }}
                >
                  <Plus className="h-3 w-3" />
                  Registrar avance
                </button>
              )}
            </div>
          </div>

          {/* Comprehension checkpoints */}
          <div>
            <p
              className="text-xs font-semibold mb-2 flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Lightbulb className="h-3 w-3" />
              Conceptos comprendidos
            </p>
            <div className="space-y-2">
              {checkpoints.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Se registran automáticamente cuando demuestras comprensión
                  durante la conversación.
                </p>
              ) : (
                checkpoints.map((c) => (
                  <div key={c.id}>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.concept}
                    </p>
                    <p
                      className="text-xs italic"
                      style={{ color: "var(--text-muted)" }}
                    >
                      "{c.student_articulation}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
