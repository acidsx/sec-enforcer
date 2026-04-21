"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Check, Loader2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved";

interface SaveContextValue {
  notify: (status: SaveStatus) => void;
}

const SaveContext = createContext<SaveContextValue>({ notify: () => {} });

export function useSaveStatus() {
  return useContext(SaveContext);
}

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");

  function notify(s: SaveStatus) {
    setStatus(s);
    if (s === "saved") {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <SaveContext.Provider value={{ notify }}>
      <div className="relative">
        <SaveBadge status={status} />
        {children}
      </div>
    </SaveContext.Provider>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") {
    return (
      <div
        className="flex items-center gap-1.5 caption"
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          color: "var(--text-tertiary)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--accent-success)",
            opacity: 0.5,
          }}
        />
        Autosave activo
      </div>
    );
  }

  if (status === "saving") {
    return (
      <div
        className="flex items-center gap-1.5 caption"
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          color: "var(--text-secondary)",
        }}
      >
        <Loader2 size={12} className="animate-spin" />
        Guardando...
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 caption"
      style={{
        position: "absolute",
        top: "0",
        right: "0",
        color: "var(--accent-success)",
      }}
    >
      <Check size={12} />
      Guardado
    </div>
  );
}
