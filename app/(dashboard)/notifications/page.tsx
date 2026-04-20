"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  priority: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=50");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
    }
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchAll();
  }

  const priorityColor: Record<string, string> = {
    low: "var(--text-muted)",
    normal: "var(--accent-primary)",
    high: "var(--warn)",
    urgent: "var(--urgent)",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Notificaciones
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {notifications.filter((n) => !n.read_at).length} sin leer
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}>
          <Bell className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 rounded-xl px-4 py-3"
              style={{
                backgroundColor: n.read_at ? "var(--bg-surface)" : "var(--focus-bg)",
                border: "1px solid var(--bg-muted)",
              }}
            >
              <div
                className="w-1 shrink-0 rounded-full"
                style={{ backgroundColor: priorityColor[n.priority], minHeight: "100%" }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                {n.body && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>}
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(n.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
