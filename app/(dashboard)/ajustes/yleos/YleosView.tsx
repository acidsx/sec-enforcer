"use client";

import { useState } from "react";
import { Bot, MessageSquare, Languages, Brain, Trash2 } from "lucide-react";
import {
  SettingsGroup,
  SettingRow,
  TileGroup,
  Tile,
} from "@/components/ajustes/SettingsGroup";
import { Toggle } from "@/components/ajustes/Toggle";
import { useToast } from "@/components/shared/MicroToast";
import { updatePreference } from "../actions";

const TONO_EJEMPLOS: Record<string, string> = {
  cercano:
    '"¿Qué tal si partimos viendo qué entiendes de la rúbrica antes de meternos al párrafo?"',
  profesional:
    '"Antes de redactar, es fundamental alinear tu interpretación con la rúbrica."',
  formal:
    '"Para garantizar la correcta ejecución del entregable, primero analicemos sistemáticamente la rúbrica."',
};

export function YleosView({
  prefs: initialPrefs,
  hoursWithYleos,
}: {
  prefs: any;
  hoursWithYleos: number;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const toast = useToast();

  async function save(key: string, value: any) {
    setPrefs((p: any) => ({ ...p, [key]: value }));
    const result = await updatePreference(key, value);
    if (!result.ok) {
      toast.show(`Error al guardar ${key}: ${result.error}`, "warn");
    }
  }

  const tono = prefs.tono_yleos || "cercano";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, var(--subject-1-bg), var(--bg-surface))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: "48px",
              height: "48px",
              background: "var(--subject-1)",
              color: "#fff",
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>YLEOS</p>
            <p className="caption">
              {hoursWithYleos}h juntos · Tutor socrático adaptado a tu estilo
            </p>
          </div>
        </div>
      </div>

      {/* Tono */}
      <SettingsGroup
        title="Tono del tutor"
        icon={
          <MessageSquare size={14} style={{ color: "var(--text-tertiary)" }} />
        }
      >
        <TileGroup>
          <Tile selected={tono === "cercano"} onClick={() => save("tono_yleos", "cercano")}>
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Cercano
            </p>
            <p className="caption">Tuteo directo, cálido</p>
          </Tile>
          <Tile
            selected={tono === "profesional"}
            onClick={() => save("tono_yleos", "profesional")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Profesional
            </p>
            <p className="caption">Equilibrado, neutro</p>
          </Tile>
          <Tile
            selected={tono === "formal"}
            onClick={() => save("tono_yleos", "formal")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Formal
            </p>
            <p className="caption">Usted, técnico</p>
          </Tile>
        </TileGroup>
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: "var(--bg-muted)",
            fontSize: "var(--fs-body)",
            color: "var(--text-secondary)",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {TONO_EJEMPLOS[tono]}
        </div>
      </SettingsGroup>

      {/* Cadencia */}
      <SettingsGroup title="Cadencia de preguntas">
        <SettingRow
          label="Cantidad de preguntas socráticas"
          desc="Cuántas preguntas hace YLEOS antes de aportar contenido"
        >
          <select
            value={prefs.cadencia_preguntas || "balanceada"}
            onChange={(e) => save("cadencia_preguntas", e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="minima">Mínima (1 pregunta)</option>
            <option value="balanceada">Balanceada (2-3)</option>
            <option value="maxima">Máxima (4-5)</option>
          </select>
        </SettingRow>
      </SettingsGroup>

      {/* Comportamiento en sesión */}
      <SettingsGroup title="Comportamiento durante la sesión">
        <SettingRow
          label="Reengage por inactividad"
          desc="YLEOS envía mensaje si llevas tiempo sin responder"
        >
          <Toggle
            checked={prefs.reengage_enabled ?? true}
            onChange={(v) => save("reengage_enabled", v)}
          />
        </SettingRow>
        <SettingRow label="Minutos antes de reengage">
          <select
            value={prefs.reengage_minutes || 4}
            onChange={(e) => save("reengage_minutes", parseInt(e.target.value))}
            style={{ width: "100px" }}
          >
            <option value="3">3 min</option>
            <option value="4">4 min</option>
            <option value="5">5 min</option>
            <option value="7">7 min</option>
            <option value="10">10 min</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Checkpoints visibles"
          desc="Mostrar puntos de comprensión durante la sesión"
        >
          <Toggle
            checked={prefs.checkpoints_visibles ?? true}
            onChange={(v) => save("checkpoints_visibles", v)}
          />
        </SettingRow>
        <SettingRow
          label="Sugerir micro-breaks"
          desc="Toast al superar los 25 minutos sugiriendo descanso"
        >
          <Toggle
            checked={prefs.sugerir_micro_breaks ?? true}
            onChange={(v) => save("sugerir_micro_breaks", v)}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Idioma */}
      <SettingsGroup
        title="Idioma del tutor"
        icon={<Languages size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow label="Idioma">
          <select
            value={prefs.idioma_yleos || "es-CL"}
            onChange={(e) => save("idioma_yleos", e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="es-CL">Español (Chile)</option>
            <option value="es-neutro">Español neutro</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </SettingRow>
      </SettingsGroup>

      {/* Memoria */}
      <SettingsGroup
        title="Historial y memoria"
        icon={<Brain size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Memoria entre sesiones"
          desc="YLEOS recuerda conversaciones previas sobre el mismo entregable"
        >
          <Toggle
            checked={prefs.memoria_entre_sesiones ?? true}
            onChange={(v) => save("memoria_entre_sesiones", v)}
          />
        </SettingRow>
        <SettingRow label="Cantidad de sesiones recordadas">
          <select
            value={prefs.memoria_sesiones_n || 5}
            onChange={(e) =>
              save("memoria_sesiones_n", parseInt(e.target.value))
            }
            style={{ width: "120px" }}
          >
            <option value="3">3 sesiones</option>
            <option value="5">5 sesiones</option>
            <option value="10">10 sesiones</option>
            <option value="999">Todas</option>
          </select>
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}
