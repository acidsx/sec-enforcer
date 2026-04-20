"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Crosshair } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();

  // Hide during immersive session
  if (pathname.startsWith("/sesion") || pathname.startsWith("/focus")) {
    return null;
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        borderColor: "var(--bg-muted)",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <div className="flex items-center gap-2">
        <Crosshair size={18} style={{ color: "var(--accent-primary)" }} />
        <span
          style={{
            fontSize: "18px",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--accent-primary)",
          }}
        >
          SEC
        </span>
      </div>
      <NotificationBell />
    </header>
  );
}
