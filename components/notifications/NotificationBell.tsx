"use client";

import { useState, useEffect, useRef } from "react";
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications?limit=10");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  }

  function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000 / 60;
    if (diff < 60) return `hace ${Math.floor(diff)}m`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return `hace ${Math.floor(diff / 1440)}d`;
  }

  const priorityColor: Record<string, string> = {
    low: "var(--text-muted)",
    normal: "var(--accent-primary)",
    high: "var(--warn)",
    urgent: "var(--urgent)",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg transition"
        style={{ color: "var(--text-muted)" }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ backgroundColor: "var(--urgent)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--bg-muted)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: "var(--bg-muted)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent-primary)" }}
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p
                className="px-4 py-8 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Sin notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read_at) markRead(n.id);
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left transition"
                  style={{
                    backgroundColor: n.read_at ? "transparent" : "var(--focus-bg)",
                  }}
                >
                  <div
                    className="w-1 shrink-0 rounded-full mt-1"
                    style={{
                      backgroundColor: priorityColor[n.priority] || "var(--text-muted)",
                      height: "32px",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {n.body}
                      </p>
                    )}
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
