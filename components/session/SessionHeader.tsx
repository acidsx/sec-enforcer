"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SessionHeaderProps {
  deliverableTitle: string;
  stepOrder: number;
  stepsTotal: number;
  onClose: (closingNote?: string) => void;
}

export function SessionHeader({
  deliverableTitle,
  stepOrder,
  stepsTotal,
  onClose,
}: SessionHeaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [note, setNote] = useState("");

  function handleCloseClick() {
    setShowDialog(true);
  }

  function handleConfirmClose() {
    onClose(note.trim() || undefined);
  }

  function handleSkipClose() {
    onClose();
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: "var(--focus-surface)",
        borderColor: "var(--bg-muted)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-sm font-medium truncate max-w-md"
          style={{ color: "var(--text-primary)" }}
        >
          {deliverableTitle}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "#fff",
            opacity: 0.8,
          }}
        >
          Paso {stepOrder}/{stepsTotal}
        </span>
      </div>

      {!showDialog ? (
        <button
          onClick={handleCloseClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition hover:opacity-80"
          style={{
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-secondary)",
          }}
        >
          <X className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="¿Qué te llevas de esta sesión? (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--bg-muted)",
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmClose();
            }}
          />
          <button
            onClick={handleConfirmClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
            }}
          >
            Cerrar
          </button>
          <button
            onClick={handleSkipClose}
            className="text-xs underline"
            style={{ color: "var(--text-muted)" }}
          >
            Saltar
          </button>
        </div>
      )}
    </header>
  );
}
