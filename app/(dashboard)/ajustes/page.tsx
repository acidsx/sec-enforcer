"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, BookOpen, Trophy, Bell, Bot, User } from "lucide-react";

export default function AjustesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string>("student");
  const [user, setUser] = useState<any>(null);
  const [prefs, setPrefs] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch("/api/user-role")
      .then((r) => r.json())
      .then((d) => setRole(d.role || "student"));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sections = [
    { href: "/asignaturas", label: "Asignaturas", icon: BookOpen, desc: "Ver y editar tus ramos" },
    { href: "/logros", label: "Logros", icon: Trophy, desc: "Histórico de medallas" },
    { href: "/notifications", label: "Notificaciones", icon: Bell, desc: "Centro de notificaciones" },
  ];

  return (
    <div className="space-y-10">
      <div className="riseup">
        <p className="label">Momento ajustes</p>
        <h1 className="mt-2" style={{ fontSize: "36px" }}>
          Tu cuenta y preferencias
        </h1>
      </div>

      {/* Profile */}
      <div className="card riseup delay-200">
        <div className="flex items-center gap-3 mb-4">
          <User size={18} style={{ color: "var(--text-tertiary)" }} />
          <p className="label">Perfil</p>
        </div>
        <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>{user?.email || "—"}</p>
        <p className="caption mt-1">
          Rol: <span className="mono">{role}</span>
        </p>
      </div>

      {/* Acelerado toggle (admin only) */}
      {role === "admin" && (
        <div className="card riseup delay-300">
          <div className="flex items-center gap-3 mb-4">
            <Bot size={18} style={{ color: "var(--text-tertiary)" }} />
            <p className="label">Opciones de administrador</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>YLEOS Acelerado</p>
              <p className="caption mt-1">
                Modo tutor con andamiaje más completo y respuestas más largas.
              </p>
            </div>
            <button className="btn btn-secondary">Configurar</button>
          </div>
        </div>
      )}

      {/* Shortcuts to deprecated views */}
      <div className="riseup delay-600">
        <p className="label mb-4">Más opciones</p>
        <div className="grid gap-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card card--clickable flex items-center gap-4"
              style={{ padding: "var(--space-5) var(--space-6)" }}
            >
              <s.icon size={20} style={{ color: "var(--text-tertiary)" }} />
              <div className="flex-1">
                <p style={{ fontWeight: 500 }}>{s.label}</p>
                <p className="caption">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="riseup delay-1100">
        <button onClick={handleLogout} className="btn btn-ghost">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
