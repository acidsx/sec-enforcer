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
  Bell,
} from "lucide-react";

const baseNavItems = [
  { href: "/", label: "Mi Semana", icon: LayoutDashboard },
  { href: "/asignaturas", label: "Asignaturas", icon: BookOpen },
  { href: "/intake", label: "Ingesta", icon: Upload },
  { href: "/deliverables", label: "Entregables", icon: FileText },
  { href: "/schedule", label: "Agenda", icon: Calendar },
  { href: "/logros", label: "Logros", icon: Trophy },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
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

  const navItems =
    role === "admin" ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Crosshair size={22} />
        SEC
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ href, label, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`sidebar__item ${isActive(href) ? "sidebar__item--active" : ""}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button onClick={handleLogout} className="sidebar__item">
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
