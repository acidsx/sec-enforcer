"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Upload,
  Calendar,
  FileText,
  BookOpen,
  Trophy,
  Crosshair,
  LogOut,
  Mail,
} from "lucide-react";

const baseNavItems = [
  { href: "/", label: "Mi Semana", icon: LayoutDashboard },
  { href: "/asignaturas", label: "Asignaturas", icon: BookOpen },
  { href: "/intake", label: "Ingesta", icon: Upload },
  { href: "/deliverables", label: "Entregables", icon: FileText },
  { href: "/schedule", label: "Agenda", icon: Calendar },
  { href: "/logros", label: "Logros", icon: Trophy },
];

const adminNavItems = [
  { href: "/triage", label: "Correo", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string>("student");

  useEffect(() => {
    fetch("/api/user-role")
      .then((r) => r.json())
      .then((d) => setRole(d.role || "student"))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href);
  }

  const navItems = role === "admin"
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <aside
      className="flex flex-col w-64 border-r shrink-0"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--bg-muted)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-5 border-b"
        style={{ borderColor: "var(--bg-muted)" }}
      >
        <Crosshair className="h-6 w-6" style={{ color: "var(--accent-primary)" }} />
        <span
          className="text-xl font-black tracking-widest"
          style={{ color: "var(--accent-primary)" }}
        >
          SEC
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
            style={{
              backgroundColor: isActive(href) ? "var(--bg-muted)" : "transparent",
              color: isActive(href) ? "var(--accent-primary)" : "var(--text-muted)",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--bg-muted)" }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
