"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User, Bot, Shield, Trophy } from "lucide-react";

export default function AjustesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string>("student");
  const [user, setUser] = useState<any>(null);
  const [logros, setLogros] = useState<any[]>([]);
  const [accelerated, setAccelerated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch("/api/user-role")
      .then((r) => r.json())
      .then((d) => setRole(d.role || "student"));

    // Load logros count
    supabase
      .from("logros")
      .select("*")
      .order("otorgado_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setLogros(data || []));

    // Load preferences
    supabase
      .from("user_preferences")
      .select("yleos_accelerated_on")
      .single()
      .then(({ data }) => setAccelerated(data?.yleos_accelerated_on || false));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function toggleAccelerated() {
    const next = !accelerated;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, yleos_accelerated_on: next });
    if (!error) setAccelerated(next);
  }

  return (
    <div className="space-y-10" style={{ maxWidth: "720px" }}>
      {/* Header */}
      <div className="riseup">
        <p className="label">Ajustes</p>
        <h1 className="mt-2" style={{ fontSize: "36px" }}>
          Tu cuenta y preferencias
        </h1>
      </div>

      {/* Perfil */}
      <div className="card riseup delay-200">
        <div className="flex items-center gap-3 mb-4">
          <User size={16} style={{ color: "var(--text-tertiary)" }} />
          <p className="label">Perfil</p>
        </div>
        <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>
          {user?.email || "—"}
        </p>
        <div className="flex gap-3 mt-2 caption">
          <span>
            Rol: <span className="mono">{role}</span>
          </span>
          <span>·</span>
          <span>Desde {user?.created_at ? new Date(user.created_at).toLocaleDateString("es-CL", { month: "long", year: "numeric" }) : "—"}</span>
        </div>
      </div>

      {/* Logros recientes */}
      {logros.length > 0 && (
        <div className="riseup delay-300">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={16} style={{ color: "var(--text-tertiary)" }} />
            <p className="label">Logros recientes</p>
          </div>
          <div className="grid gap-2">
            {logros.slice(0, 3).map((l) => (
              <div
                key={l.id}
                className="card flex items-center gap-3"
                style={{ padding: "var(--space-4) var(--space-5)" }}
              >
                <Trophy size={16} style={{ color: "var(--medal-gold)" }} />
                <div className="flex-1">
                  <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                    {l.titulo}
                  </p>
                  {l.subtitulo && (
                    <p className="caption">{l.subtitulo}</p>
                  )}
                </div>
                <span className="caption mono">
                  {new Date(l.otorgado_at).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel Admin — solo admin */}
      {role === "admin" && (
        <div
          className="card riseup delay-600"
          style={{ borderLeft: "3px solid var(--accent-urgent)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield size={16} style={{ color: "var(--accent-urgent)" }} />
            <p className="label" style={{ color: "var(--accent-urgent)" }}>
              Panel de administrador
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--bg-muted)" }}>
            <div className="flex items-center gap-3">
              <Bot size={16} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                  YLEOS Acelerado
                </p>
                <p className="caption">
                  Modo tutor con andamiaje más completo y respuestas más largas.
                </p>
              </div>
            </div>
            <button
              onClick={toggleAccelerated}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: accelerated ? "var(--accent-success)" : undefined,
                color: accelerated ? "#fff" : undefined,
                borderColor: accelerated ? "var(--accent-success)" : undefined,
              }}
            >
              {accelerated ? "Activado" : "Activar"}
            </button>
          </div>

          <p className="caption mt-3" style={{ color: "var(--text-tertiary)" }}>
            Las 5 secciones completas (Notificaciones, YLEOS, Apariencia, Cuenta) llegan en Sprint 6.
          </p>
        </div>
      )}

      {/* Logout */}
      <div className="riseup delay-1100">
        <button onClick={handleLogout} className="btn btn-ghost">
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
