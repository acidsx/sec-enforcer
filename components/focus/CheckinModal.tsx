"use client";

import { useState } from "react";
import { useCheckin } from "@/hooks/useCheckin";
import { X } from "lucide-react";

interface CheckinModalProps {
  blockId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const moodLabels = ["Muy mal", "Mal", "Normal", "Bien", "Excelente"];

export function CheckinModal({
  blockId,
  onClose,
  onSubmitted,
}: CheckinModalProps) {
  const [mood, setMood] = useState(3);
  const [progress, setProgress] = useState(50);
  const [note, setNote] = useState("");
  const { loading, error, submitCheckin } = useCheckin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await submitCheckin(blockId, mood, progress, note || undefined);
    if (result) onSubmitted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Check-in</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mood */}
          <div>
            <label className="block text-sm text-muted mb-2">
              Estado de ánimo: <span className="text-foreground font-medium">{moodLabels[mood - 1]}</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMood(val)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                    mood === val
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-muted hover:bg-border"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm text-muted mb-2">
              Progreso: <span className="text-foreground font-medium">{progress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm text-muted mb-1">
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none resize-none"
              placeholder="¿Cómo va la sesión?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent-dim transition disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar Check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}
