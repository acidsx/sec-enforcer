"use client";

import { useState, useEffect, useRef } from "react";

interface AmbientTimerProps {
  startedAt: string;
  plannedMinutes: number;
}

export function AmbientTimer({ startedAt, plannedMinutes }: AmbientTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = plannedMinutes * 60;

  useEffect(() => {
    function tick() {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  // Show toast once when hitting planned duration
  useEffect(() => {
    if (elapsed >= totalSeconds && !toastShown) {
      setToastShown(true);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [elapsed, totalSeconds, toastShown]);

  const progress = Math.min((elapsed / totalSeconds) * 100, 100);
  const overPlanned = elapsed > totalSeconds;
  const elapsedMin = Math.floor(elapsed / 60);

  return (
    <>
      {/* Timer bar — 4px, relative inside session container */}
      <div
        className="relative h-1 shrink-0"
        style={{ backgroundColor: "var(--bg-muted)" }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: overPlanned
              ? "var(--ok)"
              : "var(--accent-primary)",
            opacity: overPlanned ? 0.3 : 0.2 + (progress / 100) * 0.2,
          }}
        />

        {/* Pulse animation at planned duration */}
        {elapsed >= totalSeconds && elapsed < totalSeconds + 3 && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              backgroundColor: "var(--ok)",
              opacity: 0.15,
            }}
          />
        )}

        {/* Tooltip on hover */}
        {showTooltip && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--bg-muted)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {elapsedMin} min transcurridos · meta {plannedMinutes} min
          </div>
        )}
      </div>

      {/* Toast — non-blocking suggestion for micro-break */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm max-w-xs animate-in fade-in slide-in-from-bottom-2"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--bg-muted)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        >
          <p>
            Llevas {plannedMinutes} minutos. Si necesitas, toma un micro-break
            de 2-3 minutos.
          </p>
          <button
            onClick={() => setShowToast(false)}
            className="mt-1 text-xs underline"
            style={{ color: "var(--text-muted)" }}
          >
            Entendido
          </button>
        </div>
      )}
    </>
  );
}
