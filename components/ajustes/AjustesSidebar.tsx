"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Bell,
  Bot,
  Palette,
  Lock,
  Shield,
  LogOut,
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
  const router = useRouter();
  const supabase = createClient();

  function isActive(href: string) {
    if (href === "/ajustes") return pathname === "/ajustes";
    return pathname === href;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = role === "admin" ? [...baseItems, adminItem] : baseItems;

  return (
    <aside
      className="shrink-0"
      style={{
        width: "180px",
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

      {/* Logout siempre accesible */}
      <div
        className="mt-4 pt-4"
        style={{ borderTop: "1px solid var(--bg-muted)" }}
      >
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-all w-full text-left"
          style={{
            color: "var(--text-tertiary)",
            fontSize: "var(--fs-caption)",
          }}
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
