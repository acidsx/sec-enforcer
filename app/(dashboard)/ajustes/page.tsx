"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Bot,
  Shield,
  Trophy,
  Bell,
  Mail,
  Smartphone,
  MonitorCheck,
} from "lucide-react";

export default function AjustesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string>("student");
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [logros, setLogros] = useState<any[]>([]);
  const [counts, setCounts] = useState({ subjects: 0, deliverables: 0 });
  const [prefs, setPrefs] = useState<any>({
    yleos_accelerated_on: false,
    notif_inapp_enabled: true,
    notif_browser_enabled: false,
    notif_email_enabled: false,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    const roleRes = await fetch("/api/user-role");
    const roleData = await roleRes.json();
    setRole(roleData.role || "student");
    setRoleLoaded(true);

    const { data: logrosData } = await supabase
      .from("logros")
      .select("*")
      .order("otorgado_at", { ascending: false })
      .limit(5);
    setLogros(logrosData || []);

    if (userData.user) {
      const [{ count: sc }, { count: dc }] = await Promise.all([
        supabase
          .from("subjects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.user.id),
        supabase
          .from("deliverables")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.user.id),
      ]);
      setCounts({ subjects: sc || 0, deliverables: dc || 0 });

      const { data: prefsData } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (prefsData) {
        setPrefs({
          yleos_accelerated_on: prefsData.yleos_accelerated_on || false,
          notif_inapp_enabled: prefsData.notif_inapp_enabled ?? true,
          notif_browser_enabled: prefsData.notif_browser_enabled || false,
          notif_email_enabled: prefsData.notif_email_enabled || false,
        });
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function updatePref(key: string, value: boolean) {
    if (!user) return;

    // Special handling for browser push — requires subscription flow
    if (key === "notif_browser_enabled") {
      const { subscribeToPush, unsubscribeFromPush } = await import(
        "@/lib/notifications/push-client"
      );
      if (value) {
        const ok = await subscribeToPush();
        if (!ok) {
          return; // keep toggle off
        }
      } else {
        await unsubscribeFromPush();
      }
    }

    setPrefs((p: any) => ({ ...p, [key]: value }));
    await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      });
  }

  return (
    <div className="space-y-10" style={{ maxWidth: "720px" }}>
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
          {user?.email || "Cargando..."}
        </p>
        <div className="flex gap-3 mt-2 caption flex-wrap">
          <span>
            Rol: <span className="mono">{roleLoaded ? role : "..."}</span>
          </span>
          {user?.created_at && (
            <>
              <span style={{ color: "var(--text-tertiary)" }}>·</span>
              <span>
                Desde{" "}
                {new Date(user.created_at).toLocaleDateString("es-CL", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>

        <div
          className="grid grid-cols-3 gap-3 mt-5 pt-5"
          style={{ borderTop: "1px solid var(--bg-muted)" }}
        >
          <StatCell label="Asignaturas" value={counts.subjects} />
          <StatCell label="Entregables" value={counts.deliverables} />
          <StatCell label="Logros" value={logros.length} />
        </div>
      </div>

      {/* Notificaciones */}
      <div className="card riseup delay-300">
        <div className="flex items-center gap-3 mb-5">
          <Bell size={16} style={{ color: "var(--text-tertiary)" }} />
          <p className="label">Notificaciones</p>
        </div>

        <div className="space-y-4">
          <NotifRow
            icon={MonitorCheck}
            label="In-app"
            desc="Campana y toasts dentro de SEC"
            checked={prefs.notif_inapp_enabled}
            onChange={(v) => updatePref("notif_inapp_enabled", v)}
          />
          <NotifRow
            icon={Smartphone}
            label="Browser push"
            desc="Notificaciones del sistema (requiere permiso)"
            checked={prefs.notif_browser_enabled}
            onChange={(v) => updatePref("notif_browser_enabled", v)}
          />
          <NotifRow
            icon={Mail}
            label="Email"
            desc="Resumen diario + urgencias a tu correo"
            checked={prefs.notif_email_enabled}
            onChange={(v) => updatePref("notif_email_enabled", v)}
          />
        </div>
      </div>

      {/* Logros */}
      <div className="card riseup delay-600">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={16} style={{ color: "var(--text-tertiary)" }} />
          <p className="label">Logros recientes</p>
        </div>
        {logros.length === 0 ? (
          <p className="caption" style={{ color: "var(--text-tertiary)" }}>
            Aún no tienes logros. Se otorgan al completar fases, entregables y
            más.
          </p>
        ) : (
          <div className="space-y-3">
            {logros.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <Trophy size={14} style={{ color: "var(--medal-gold)" }} />
                <div className="flex-1">
                  <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                    {l.titulo}
                  </p>
                  {l.subtitulo && <p className="caption">{l.subtitulo}</p>}
                </div>
                <span
                  className="caption mono"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {new Date(l.otorgado_at).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel Admin */}
      {roleLoaded && role === "admin" && (
        <div
          className="card riseup"
          style={{
            borderLeft: "3px solid var(--accent-urgent)",
            animationDelay: "900ms",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield size={16} style={{ color: "var(--accent-urgent)" }} />
            <p className="label" style={{ color: "var(--accent-urgent)" }}>
              Panel de administrador
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Bot size={16} style={{ color: "var(--text-tertiary)" }} />
            <div className="flex-1">
              <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                YLEOS Acelerado
              </p>
              <p className="caption">
                Modo tutor con andamiaje más completo y respuestas más largas.
              </p>
            </div>
            <Toggle
              checked={prefs.yleos_accelerated_on}
              onChange={(v) => updatePref("yleos_accelerated_on", v)}
            />
          </div>
        </div>
      )}

      {/* Cuenta */}
      <div className="card riseup" style={{ animationDelay: "1100ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <LogOut size={16} style={{ color: "var(--text-tertiary)" }} />
          <p className="label">Cuenta</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ color: "var(--accent-urgent)" }}
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p
        style={{
          fontSize: "var(--fs-h2)",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </p>
      <p className="caption" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </div>
  );
}

function NotifRow({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} style={{ color: "var(--text-tertiary)" }} />
      <div className="flex-1">
        <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>{label}</p>
        <p className="caption">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative rounded-full transition-all shrink-0"
      style={{
        width: "40px",
        height: "22px",
        backgroundColor: checked
          ? "var(--accent-primary)"
          : "var(--bg-muted)",
      }}
    >
      <span
        className="absolute rounded-full transition-all"
        style={{
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px",
          height: "16px",
          backgroundColor: "#fff",
        }}
      />
    </button>
  );
}
