"use client";

import { useState, useCallback } from "react";
import { PomodoroTimer } from "./PomodoroTimer";
import { CheckinModal } from "./CheckinModal";
import { AlertOverlay } from "./AlertOverlay";
import { useFocusBlock } from "@/hooks/useFocusBlock";
import { Shield, ClipboardCheck } from "lucide-react";
import type { FragmentStep } from "@/types/database";

interface QuarantineScreenProps {
  step?: FragmentStep | null;
  blockId?: string;
  durationMinutes?: number;
  onEnd: () => void;
}

export function QuarantineScreen({
  step,
  blockId,
  durationMinutes = 25,
  onEnd,
}: QuarantineScreenProps) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { endBlock } = useFocusBlock();

  const handleComplete = useCallback(() => {
    setCompleted(true);
    setShowAlert(true);
  }, []);

  async function handleEnd(status: "completed" | "abandoned") {
    if (blockId) {
      await endBlock(blockId, status);
    }
    onEnd();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] relative">
      {/* Quarantine header */}
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-widest text-accent uppercase">
          Modo Cuarentena
        </span>
      </div>

      {/* Current step info */}
      {step && (
        <div className="mb-8 text-center max-w-md">
          <h2 className="text-lg font-bold">{step.title}</h2>
          {step.description && (
            <p className="text-sm text-muted mt-1">{step.description}</p>
          )}
        </div>
      )}

      {/* Timer */}
      <PomodoroTimer
        durationMinutes={durationMinutes}
        onComplete={handleComplete}
      />

      {/* Action buttons */}
      <div className="mt-8 flex gap-3">
        {blockId && (
          <button
            onClick={() => setShowCheckin(true)}
            className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
          >
            <ClipboardCheck className="h-4 w-4" />
            Check-in
          </button>
        )}
        <button
          onClick={() => handleEnd("abandoned")}
          className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
        >
          Abandonar
        </button>
        {completed && (
          <button
            onClick={() => handleEnd("completed")}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Completar Bloque
          </button>
        )}
      </div>

      {/* Modals */}
      {showCheckin && blockId && (
        <CheckinModal
          blockId={blockId}
          onClose={() => setShowCheckin(false)}
          onSubmitted={() => setShowCheckin(false)}
        />
      )}

      {showAlert && (
        <AlertOverlay
          message={
            completed
              ? "Sesión completada. Puedes registrar tu progreso o iniciar otra sesión."
              : "Mantén el enfoque. Evita distracciones."
          }
          onDismiss={() => setShowAlert(false)}
        />
      )}
    </div>
  );
}
