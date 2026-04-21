"use client";

import { useState } from "react";
import { Shield, Bot, BarChart3, Flag, Mail, Zap } from "lucide-react";
import { SettingsGroup, SettingRow } from "@/components/ajustes/SettingsGroup";
import { Toggle } from "@/components/ajustes/Toggle";
import { updatePreference, toggleFeatureFlag } from "../actions";

interface AdminViewProps {
  prefs: any;
  flags: any[];
  usage: Record<string, { tokens: number; count: number }>;
}

export function AdminView({
  prefs: initialPrefs,
  flags: initialFlags,
  usage,
}: AdminViewProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [flags, setFlags] = useState(initialFlags);

  async function save(key: string, value: any) {
    setPrefs((p: any) => ({ ...p, [key]: value }));
    await updatePreference(key, value);
  }

  async function toggleFlag(flagKey: string, enabled: boolean) {
    setFlags((fs: any[]) =>
      fs.map((f) =>
        f.flag_key === flagKey
          ? { ...f, enabled, status: enabled ? "on" : "off" }
          : f
      )
    );
    await toggleFeatureFlag(flagKey, enabled);
  }

  const modes = ["analyst", "tutor", "reviewer"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="card"
        style={{ borderLeft: "3px solid var(--accent-urgent)" }}
      >
        <div className="flex items-center gap-3">
          <Shield size={20} style={{ color: "var(--accent-urgent)" }} />
          <div>
            <p
              className="label"
              style={{ color: "var(--accent-urgent)" }}
            >
              Panel de administrador
            </p>
            <p className="caption mt-1">
              Solo visible para cuentas con rol admin. Acciones sensibles.
            </p>
          </div>
        </div>
      </div>

      {/* YLEOS Acelerado */}
      <SettingsGroup
        title="YLEOS Acelerado"
        icon={<Bot size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Modo Acelerado"
          desc="Andamiaje más completo, respuestas más largas. Preserva límite ético."
        >
          <Toggle
            checked={prefs.yleos_accelerated_on || false}
            onChange={(v) => save("yleos_accelerated_on", v)}
          />
        </SettingRow>
        <SettingRow label="Temperatura del modelo">
          <select
            value={prefs.temperatura_modelo || "default"}
            onChange={(e) => save("temperatura_modelo", e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="default">Default (0.5-0.7)</option>
            <option value="conservador">Conservador (0.3)</option>
            <option value="exploratorio">Exploratorio (0.9)</option>
          </select>
        </SettingRow>
      </SettingsGroup>

      {/* Uso */}
      <SettingsGroup
        title="Uso de YLEOS · últimos 30 días"
        icon={<BarChart3 size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <div className="grid grid-cols-3 gap-3 mt-2">
          {modes.map((m) => {
            const u = usage[m] || { tokens: 0, count: 0 };
            return (
              <div
                key={m}
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <p className="label">{m}</p>
                <p
                  className="mono mt-2"
                  style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}
                >
                  {(u.tokens / 1000).toFixed(1)}k
                </p>
                <p className="caption">{u.count} invocaciones</p>
              </div>
            );
          })}
        </div>
      </SettingsGroup>

      {/* Feature flags */}
      <SettingsGroup
        title="Feature flags"
        icon={<Flag size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        {flags.length === 0 ? (
          <p className="caption">Sin flags. Ejecuta la migration primero.</p>
        ) : (
          <div className="space-y-3">
            {flags.map((f: any) => (
              <div
                key={f.flag_key}
                className="flex items-center justify-between py-2"
                style={{ borderTop: "1px solid var(--bg-muted)" }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono" style={{ fontSize: "var(--fs-caption)" }}>
                      {f.flag_key}
                    </span>
                    <span
                      className={`chip ${
                        f.status === "on"
                          ? "chip--ok"
                          : f.status === "beta"
                            ? "chip--info"
                            : ""
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  {f.description && (
                    <p className="caption mt-1">{f.description}</p>
                  )}
                </div>
                <Toggle
                  checked={f.enabled}
                  onChange={(v) => toggleFlag(f.flag_key, v)}
                />
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* Outlook */}
      <SettingsGroup
        title="Módulo correo Outlook"
        icon={<Mail size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Estado"
          desc="Requiere registro de app en Azure AD"
        >
          <span className="chip chip--warn">Standby</span>
        </SettingRow>
      </SettingsGroup>

      {/* Acciones destructivas */}
      <SettingsGroup
        title="Acciones destructivas"
        icon={<Zap size={14} style={{ color: "var(--accent-urgent)" }} />}
        danger
      >
        <SettingRow
          label="Purgar cache de análisis YLEOS"
          desc="Fuerza re-análisis en próxima llamada. Irreversible."
        >
          <button
            onClick={() => alert("Cache purgado (placeholder)")}
            className="btn btn-secondary btn-sm"
          >
            Purgar
          </button>
        </SettingRow>
        <SettingRow
          label="Re-ejecutar análisis de todos los PDFs"
          desc="Batch. Consume tokens proporcional al total de entregables."
        >
          <button
            onClick={() => alert("Batch iniciado (placeholder)")}
            className="btn btn-secondary btn-sm"
          >
            Ejecutar batch
          </button>
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}
