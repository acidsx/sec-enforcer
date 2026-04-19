"use client";

import { AlertTriangle } from "lucide-react";

interface AlertOverlayProps {
  message: string;
  onDismiss: () => void;
}

export function AlertOverlay({ message, onDismiss }: AlertOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80">
      <div className="w-full max-w-sm rounded-xl bg-surface border-2 border-accent p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Alerta de Enfoque</h2>
        <p className="text-muted mb-6">{message}</p>
        <button
          onClick={onDismiss}
          className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dim transition"
        >
          Volver al enfoque
        </button>
      </div>
    </div>
  );
}
