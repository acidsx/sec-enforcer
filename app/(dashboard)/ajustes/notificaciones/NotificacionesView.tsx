"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  MonitorCheck,
  Clock,
  Moon,
} from "lucide-react";
import { Toggle } from "@/components/ajustes/Toggle";
import { SettingsGroup, SettingRow } from "@/components/ajustes/SettingsGroup";
import { updatePreference } from "../actions";

const NOTIF_KINDS = [
  { key: "deadline_proximo", label: "Deadline próximo", desc: "<3 días" },
  { key: "progreso_bajo", label: "Progreso bajo", desc: "avance <30%" },
  { key: "revisor_listo", label: "Revisión YLEOS lista", desc: "doc revisado" },
  { key: "logro", label: "Logro obtenido", desc: "fase/entregable" },
  { key: "sugerencia", label: "Sugerencia de sesión", desc: "día sin abrir SEC" },
];

const CHANNELS = [
  { key: "inapp", label: "In-app" },
  { key: "browser", label: "Browser" },
  { key: "email", label: "Email" },
];

export function NotificacionesView({ prefs: initialPrefs }: { prefs: any }) {
  const [prefs, setPrefs] = useState(initialPrefs);

  async function save(key: string, value: any) {
    setPrefs((p: any) => ({ ...p, [key]: value }));
    await updatePreference(key, value);
  }

  async function setMatrixCell(kind: string, channel: string, value: boolean) {
    const newMatrix = {
      ...(prefs.notif_matrix || {}),
      [kind]: { ...(prefs.notif_matrix?.[kind] || {}), [channel]: value },
    };
    save("notif_matrix", newMatrix);
  }

  function getMatrixCell(kind: string, channel: string): boolean {
    const m = prefs.notif_matrix?.[kind];
    if (m && typeof m[channel] === "boolean") return m[channel];
    // Default: in-app sí, browser/email no
    return channel === "inapp";
  }

  return (
    <div className="space-y-6">
      {/* Canales principales */}
      <div className="grid grid-cols-3 gap-3">
        <ChannelCard
          icon={MonitorCheck}
          title="In-app"
          subtitle="Dentro de SEC"
          enabled={prefs.notif_inapp_enabled ?? true}
          onChange={(v) => save("notif_inapp_enabled", v)}
        />
        <ChannelCard
          icon={Smartphone}
          title="Browser push"
          subtitle="Notificaciones del SO"
          enabled={prefs.notif_browser_enabled ?? false}
          onChange={(v) => save("notif_browser_enabled", v)}
        />
        <ChannelCard
          icon={Mail}
          title="Email"
          subtitle="Correo + digest"
          enabled={prefs.notif_email_enabled ?? false}
          onChange={(v) => save("notif_email_enabled", v)}
        />
      </div>

      {/* Digest */}
      <SettingsGroup
        title="Digest diario"
        icon={<Clock size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Hora del resumen"
          desc="A qué hora enviar el digest acumulado del día"
        >
          <input
            type="number"
            min={0}
            max={23}
            value={prefs.notif_email_digest_hour ?? 7}
            onChange={(e) =>
              save("notif_email_digest_hour", parseInt(e.target.value))
            }
            style={{ width: "80px" }}
          />
        </SettingRow>
        <SettingRow
          label="Saltar fines de semana"
          desc="No enviar digest sábados ni domingos"
        >
          <Toggle
            checked={prefs.notif_skip_weekends || false}
            onChange={(v) => save("notif_skip_weekends", v)}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Matriz 5×3 */}
      <SettingsGroup
        title="Qué se envía por qué canal"
        icon={<Bell size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <div
          className="mt-2 overflow-x-auto"
          style={{ marginLeft: "calc(-1 * var(--space-4))", marginRight: "calc(-1 * var(--space-4))" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "500px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "var(--space-3) var(--space-4)",
                    fontSize: "var(--fs-label)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-tertiary)",
                  }}
                />
                {CHANNELS.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      padding: "var(--space-3) var(--space-2)",
                      fontSize: "var(--fs-label)",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-tertiary)",
                      textAlign: "center",
                      width: "80px",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIF_KINDS.map((k) => (
                <tr
                  key={k.key}
                  style={{ borderTop: "1px solid var(--bg-muted)" }}
                >
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                      {k.label}
                    </p>
                    <p className="caption">{k.desc}</p>
                  </td>
                  {CHANNELS.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: "var(--space-3) var(--space-2)",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={getMatrixCell(k.key, c.key)}
                        onChange={(e) =>
                          setMatrixCell(k.key, c.key, e.target.checked)
                        }
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "var(--accent-primary)",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsGroup>

      {/* Silencio en sesión */}
      <SettingsGroup
        title="Durante sesiones"
        icon={<Moon size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Silenciar notificaciones"
          desc="Solo urgent llegan durante sesión activa"
        >
          <Toggle
            checked={prefs.notif_silent_in_session ?? true}
            onChange={(v) => save("notif_silent_in_session", v)}
          />
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  subtitle,
  enabled,
  onChange,
}: {
  icon: any;
  title: string;
  subtitle: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Icon
            size={18}
            style={{ color: "var(--text-tertiary)", marginBottom: "8px" }}
          />
          <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
            {title}
          </p>
          <p className="caption">{subtitle}</p>
        </div>
        <Toggle checked={enabled} onChange={onChange} />
      </div>
    </div>
  );
}
