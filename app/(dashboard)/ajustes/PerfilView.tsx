"use client";

import { useState, useEffect } from "react";
import { User, GraduationCap, BookOpen, Clock, Trophy } from "lucide-react";
import { SettingsGroup, SettingRow } from "@/components/ajustes/SettingsGroup";
import { updatePreference } from "./actions";

interface PerfilViewProps {
  user: any;
  role: string;
  prefs: any;
  stats: { subjects: number; deliverables: number; hours: number };
}

export function PerfilView({ user, role, prefs: initialPrefs, stats }: PerfilViewProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [savedField, setSavedField] = useState<string | null>(null);

  async function save(key: string, value: any) {
    setPrefs((p: any) => ({ ...p, [key]: value }));
    await updatePreference(key, value);
    setSavedField(key);
    setTimeout(() => setSavedField(null), 1500);
  }

  const emailInitials = user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: "64px",
              height: "64px",
              background:
                "linear-gradient(135deg, var(--subject-1), var(--subject-4))",
              color: "#fff",
              fontSize: "26px",
              fontWeight: 500,
            }}
          >
            {emailInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: "var(--fs-h2)", fontWeight: 500 }}>
                {prefs.nombre_yleos_llama || user.email?.split("@")[0]}
              </p>
              {role === "admin" && (
                <span className="chip chip--info">Admin</span>
              )}
            </div>
            <p className="caption mt-1">{user.email}</p>
            <div className="flex gap-3 mt-2 caption" style={{ color: "var(--text-tertiary)" }}>
              {user.created_at && (
                <span>
                  Miembro desde{" "}
                  {new Date(user.created_at).toLocaleDateString("es-CL", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-4 mt-6 pt-6"
          style={{ borderTop: "1px solid var(--bg-muted)" }}
        >
          <Stat icon={BookOpen} label="Asignaturas" value={stats.subjects} />
          <Stat icon={GraduationCap} label="Pendientes" value={stats.deliverables} />
          <Stat icon={Clock} label="Horas de enfoque" value={`${stats.hours}h`} />
        </div>
      </div>

      {/* Identidad */}
      <SettingsGroup title="Identidad" icon={<User size={14} style={{ color: "var(--text-tertiary)" }} />}>
        <SettingRow
          label="Cómo te llama YLEOS"
          desc="Nombre con el que el tutor se dirige a ti"
        >
          <input
            type="text"
            value={prefs.nombre_yleos_llama || ""}
            onChange={(e) => setPrefs({ ...prefs, nombre_yleos_llama: e.target.value })}
            onBlur={(e) => save("nombre_yleos_llama", e.target.value)}
            placeholder={user.email?.split("@")[0]}
            style={{ width: "200px" }}
          />
        </SettingRow>
        <SettingRow label="Email" desc="No editable">
          <input type="email" value={user.email} disabled style={{ width: "260px" }} />
        </SettingRow>
      </SettingsGroup>

      {/* Contexto académico */}
      <SettingsGroup
        title="Contexto académico"
        icon={<GraduationCap size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow label="Universidad">
          <input
            type="text"
            value={prefs.universidad || ""}
            onChange={(e) => setPrefs({ ...prefs, universidad: e.target.value })}
            onBlur={(e) => save("universidad", e.target.value)}
            placeholder="Ej: Universidad Autónoma de Chile"
            style={{ width: "280px" }}
          />
        </SettingRow>
        <SettingRow label="Carrera">
          <input
            type="text"
            value={prefs.carrera || ""}
            onChange={(e) => setPrefs({ ...prefs, carrera: e.target.value })}
            onBlur={(e) => save("carrera", e.target.value)}
            placeholder="Ej: Ingeniería Comercial"
            style={{ width: "280px" }}
          />
        </SettingRow>
        <SettingRow label="Año académico">
          <select
            value={prefs.ano_academico || ""}
            onChange={(e) => save("ano_academico", e.target.value)}
            style={{ width: "160px" }}
          >
            <option value="">Seleccionar</option>
            <option>1er año</option>
            <option>2do año</option>
            <option>3er año</option>
            <option>4to año</option>
            <option>5to año</option>
            <option>Otro</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Contexto laboral"
          desc="Información útil para YLEOS al contextualizar tareas"
        >
          <input
            type="text"
            value={prefs.contexto_laboral || ""}
            onChange={(e) => setPrefs({ ...prefs, contexto_laboral: e.target.value })}
            onBlur={(e) => save("contexto_laboral", e.target.value)}
            placeholder="Ej: Gerente General en SXTECH"
            style={{ width: "280px" }}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Zona horaria */}
      <SettingsGroup title="Zona horaria y localización">
        <SettingRow label="Zona horaria">
          <select
            value={prefs.zona_horaria || "America/Santiago"}
            onChange={(e) => save("zona_horaria", e.target.value)}
            style={{ width: "220px" }}
          >
            <option value="America/Santiago">Santiago (Chile)</option>
            <option value="America/Mexico_City">Ciudad de México</option>
            <option value="America/Bogota">Bogotá</option>
            <option value="America/Lima">Lima</option>
            <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
            <option value="Europe/Madrid">Madrid</option>
          </select>
        </SettingRow>
        <SettingRow label="Inicio de semana">
          <select
            value={prefs.inicio_semana || "lunes"}
            onChange={(e) => save("inicio_semana", e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="lunes">Lunes</option>
            <option value="domingo">Domingo</option>
          </select>
        </SettingRow>
      </SettingsGroup>

      {/* Autosave indicator */}
      {savedField && (
        <div className="flex items-center gap-2 caption" style={{ color: "var(--accent-success)" }}>
          <span
            className="subject-dot subject-dot--pulse"
            style={{ ["--subject-color" as any]: "var(--accent-success)" }}
          />
          Guardado
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: "var(--text-tertiary)" }} />
        <span className="label">{label}</span>
      </div>
      <p
        className="mt-1"
        style={{ fontSize: "var(--fs-h2)", fontWeight: 500 }}
      >
        {value}
      </p>
    </div>
  );
}
