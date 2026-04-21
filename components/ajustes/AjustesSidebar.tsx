"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Bell,
  Bot,
  Palette,
  Lock,
  Shield,
} from "lucide-react";

const baseItems = [
  { href: "/ajustes", label: "Perfil", icon: User },
  { href: "/ajustes/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/ajustes/yleos", label: "YLEOS", icon: Bot },
  { href: "/ajustes/apariencia", label: "Apariencia", icon: Palette },
  { href: "/ajustes/cuenta", label: "Cuenta", icon: Lock },
];

const adminItem = { href: "/ajustes/admin", label: "Panel Admin", icon: Shield };

export function AjustesSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/ajustes") return pathname === "/ajustes";
    return pathname === href;
  }

  const items = role === "admin" ? [...baseItems, adminItem] : baseItems;

  return (
    <aside
      className="shrink-0"
      style={{
        width: "170px",
        position: "sticky",
        top: "var(--space-6)",
      }}
    >
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const isAdmin = href === "/ajustes/admin";
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-all"
              style={{
                backgroundColor: active ? "var(--bg-muted)" : "transparent",
                color: isAdmin
                  ? "var(--accent-urgent)"
                  : active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                fontSize: "var(--fs-caption)",
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
