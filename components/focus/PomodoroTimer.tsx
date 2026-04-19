"use client";

import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { Play, Pause, RotateCcw } from "lucide-react";

interface PomodoroTimerProps {
  durationMinutes: number;
  onComplete: () => void;
}

export function PomodoroTimer({
  durationMinutes,
  onComplete,
}: PomodoroTimerProps) {
  const { minutes, seconds, status, progress, start, pause, resume, reset } =
    usePomodoroTimer({
      durationMinutes,
      onComplete,
    });

  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circle progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular timer */}
      <div className="relative">
        <svg width="280" height="280" className="-rotate-90">
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold tracking-wider">
            {display}
          </span>
          <span className="text-sm text-muted mt-1 capitalize">{status}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {status === "idle" && (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dim transition"
          >
            <Play className="h-4 w-4" />
            Iniciar
          </button>
        )}
        {status === "running" && (
          <button
            onClick={pause}
            className="flex items-center gap-2 rounded-lg bg-surface-2 px-6 py-2.5 font-semibold text-foreground hover:bg-border transition"
          >
            <Pause className="h-4 w-4" />
            Pausar
          </button>
        )}
        {status === "paused" && (
          <>
            <button
              onClick={resume}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dim transition"
            >
              <Play className="h-4 w-4" />
              Continuar
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2.5 text-muted hover:bg-border transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}
        {status === "completed" && (
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-surface-2 px-6 py-2.5 font-semibold text-foreground hover:bg-border transition"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}
