"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "info" | "warn";
}

interface ToastContextValue {
  show: (msg: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const show = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToast({ id, message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const color =
    toast?.type === "warn"
      ? "var(--accent-urgent)"
      : toast?.type === "info"
        ? "var(--accent-info)"
        : "var(--accent-success)";

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {mounted && toast
        ? createPortal(
            <div
              className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--bg-muted)",
                animation: "riseup 0.3s cubic-bezier(.2,.9,.3,1)",
                maxWidth: "360px",
              }}
            >
              <CheckCircle2 size={18} style={{ color }} />
              <span
                style={{
                  fontSize: "var(--fs-body)",
                  color: "var(--text-primary)",
                }}
              >
                {toast.message}
              </span>
              <button
                onClick={() => setToast(null)}
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={14} />
              </button>
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}
