"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar, Send, Settings, Mail } from "lucide-react";
import { useEffect, useState } from "react";

const moments = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/planificar", label: "Planificar", icon: Calendar },
  { href: "/entregar", label: "Entregar", icon: Send },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function MomentPills() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/user-role")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.role === "admin"))
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href);
  }

  // Hide pills during session
  if (pathname.startsWith("/sesion") || pathname.startsWith("/focus")) {
    return null;
  }

  const items = [...moments];
  if (isAdmin) {
    items.splice(3, 0, { href: "/triage", label: "Correo", icon: Mail });
  }

  return (
    <nav className="moment-pills">
      {items.map(({ href, label, icon: Icon }) => (
        <button
          key={href}
          onClick={() => router.push(href)}
          className={`moment-pill ${isActive(href) ? "moment-pill--active" : ""}`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </nav>
  );
}
