"use client";

import { useState } from "react";
import { Palette, Type, Zap, Keyboard, RotateCcw } from "lucide-react";
import {
  SettingsGroup,
  SettingRow,
  TileGroup,
  Tile,
} from "@/components/ajustes/SettingsGroup";
import { Toggle } from "@/components/ajustes/Toggle";
import {
  updatePreference,
  updateMultiplePreferences,
} from "../actions";

export function AparienciaView({ prefs: initialPrefs }: { prefs: any }) {
  const [prefs, setPrefs] = useState(initialPrefs);

  async function save(key: string, value: any) {
    setPrefs((p: any) => ({ ...p, [key]: value }));
    await updatePreference(key, value);
  }

  async function resetAll() {
    const defaults = {
      densidad_ui: "comoda",
      canvas_tono: "calido",
      tipografia_paso: "serif",
      tamano_texto: 100,
      animaciones: "completas",
    };
    setPrefs((p: any) => ({ ...p, ...defaults }));
    await updateMultiplePreferences(defaults);
  }

  const densidad = prefs.densidad_ui || "comoda";
  const canvas = prefs.canvas_tono || "calido";
  const tipografia = prefs.tipografia_paso || "serif";
  const tamano = prefs.tamano_texto || 100;
  const animaciones = prefs.animaciones || "completas";

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="caption">
          SEC usa un tema único en light mode. Estos ajustes afectan solo tu
          experiencia visual.
        </p>
      </div>

      {/* Densidad */}
      <SettingsGroup
        title="Densidad"
        icon={<Palette size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <TileGroup>
          <Tile
            selected={densidad === "compacta"}
            onClick={() => save("densidad_ui", "compacta")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Compacta
            </p>
            <div
              className="mt-2 space-y-1"
              style={{ height: "40px" }}
            >
              <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "3px" }} />
              <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "3px" }} />
              <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "3px" }} />
            </div>
          </Tile>
          <Tile
            selected={densidad === "comoda"}
            onClick={() => save("densidad_ui", "comoda")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Cómoda
            </p>
            <div className="mt-2 space-y-2" style={{ height: "40px" }}>
              <div style={{ height: "8px", background: "var(--bg-muted)", borderRadius: "3px" }} />
              <div style={{ height: "8px", background: "var(--bg-muted)", borderRadius: "3px" }} />
            </div>
          </Tile>
          <Tile
            selected={densidad === "espaciosa"}
            onClick={() => save("densidad_ui", "espaciosa")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Espaciosa
            </p>
            <div className="mt-2 space-y-3" style={{ height: "40px" }}>
              <div style={{ height: "10px", background: "var(--bg-muted)", borderRadius: "3px" }} />
              <div style={{ height: "10px", background: "var(--bg-muted)", borderRadius: "3px" }} />
            </div>
          </Tile>
        </TileGroup>
      </SettingsGroup>

      {/* Canvas */}
      <SettingsGroup title="Tonalidad del canvas">
        <div className="grid grid-cols-2 gap-2">
          <Tile
            selected={canvas === "calido"}
            onClick={() => save("canvas_tono", "calido")}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "#F5F1EA",
                  border: "1px solid var(--bg-muted)",
                  borderRadius: "6px",
                }}
              />
              <div>
                <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>Cálido</p>
                <p className="caption">Beige default</p>
              </div>
            </div>
          </Tile>
          <Tile
            selected={canvas === "puro"}
            onClick={() => save("canvas_tono", "puro")}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid var(--bg-muted)",
                  borderRadius: "6px",
                }}
              />
              <div>
                <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>Puro</p>
                <p className="caption">Blanco limpio</p>
              </div>
            </div>
          </Tile>
        </div>
      </SettingsGroup>

      {/* Tipografía */}
      <SettingsGroup
        title="Tipografía del paso en sesión"
        icon={<Type size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <div className="grid grid-cols-2 gap-2">
          <Tile
            selected={tipografia === "serif"}
            onClick={() => save("tipografia_paso", "serif")}
          >
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "18px", fontWeight: 500 }}>
              Analiza el caso
            </p>
            <p className="caption mt-1">Serif · lectura pausada</p>
          </Tile>
          <Tile
            selected={tipografia === "sans"}
            onClick={() => save("tipografia_paso", "sans")}
          >
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 500 }}>
              Analiza el caso
            </p>
            <p className="caption mt-1">Sans · moderna directa</p>
          </Tile>
        </div>
      </SettingsGroup>

      {/* Tamaño texto */}
      <SettingsGroup title="Tamaño de texto base">
        <SettingRow label="Escala global" desc="80-140%">
          <div className="flex items-center gap-2">
            <button
              onClick={() => save("tamano_texto", Math.max(80, tamano - 10))}
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 10px" }}
            >
              −
            </button>
            <span className="mono" style={{ minWidth: "50px", textAlign: "center" }}>
              {tamano}%
            </span>
            <button
              onClick={() => save("tamano_texto", Math.min(140, tamano + 10))}
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 10px" }}
            >
              +
            </button>
          </div>
        </SettingRow>
      </SettingsGroup>

      {/* Animaciones */}
      <SettingsGroup
        title="Animaciones"
        icon={<Zap size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <TileGroup>
          <Tile
            selected={animaciones === "completas"}
            onClick={() => save("animaciones", "completas")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Completas
            </p>
            <p className="caption">Default</p>
          </Tile>
          <Tile
            selected={animaciones === "reducidas"}
            onClick={() => save("animaciones", "reducidas")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Reducidas
            </p>
            <p className="caption">Solo esenciales</p>
          </Tile>
          <Tile
            selected={animaciones === "ninguna"}
            onClick={() => save("animaciones", "ninguna")}
          >
            <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
              Ninguna
            </p>
            <p className="caption">Sin movimiento</p>
          </Tile>
        </TileGroup>
      </SettingsGroup>

      {/* Atajos teclado */}
      <SettingsGroup
        title="Atajos de teclado"
        icon={<Keyboard size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Habilitar atajos"
          desc="H / P / E / A para navegar · Esc para cerrar modales · Cmd+K palette"
        >
          <Toggle
            checked={prefs.keyboard_shortcuts_enabled ?? true}
            onChange={(v) => save("keyboard_shortcuts_enabled", v)}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Reset */}
      <div>
        <button onClick={resetAll} className="btn btn-ghost">
          <RotateCcw size={14} />
          Restaurar apariencia por defecto
        </button>
      </div>
    </div>
  );
}
