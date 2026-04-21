"use client";

import { useState } from "react";
import {
  Lock,
  Shield,
  Smartphone,
  Download,
  LogOut,
  AlertTriangle,
  Archive,
  Trash2,
} from "lucide-react";
import { SettingsGroup, SettingRow } from "@/components/ajustes/SettingsGroup";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CuentaView({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function exportData() {
    const res = await fetch("/api/user-role");
    if (!res.ok) return;
    alert(
      "Función de exportación en desarrollo. Contacta a soporte para solicitar tus datos."
    );
  }

  return (
    <div className="space-y-6">
      {/* Credenciales */}
      <SettingsGroup
        title="Credenciales"
        icon={<Lock size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow label="Email" desc="No editable">
          <input type="email" value={user.email} disabled style={{ width: "280px" }} />
        </SettingRow>
        <SettingRow
          label="Contraseña"
          desc="Última actualización desconocida"
        >
          <button className="btn btn-secondary btn-sm">Cambiar</button>
        </SettingRow>
        <SettingRow
          label="Autenticación de dos factores"
          desc="Recomendada"
        >
          <span className="chip chip--warn">No configurada</span>
        </SettingRow>
      </SettingsGroup>

      {/* Sesiones activas */}
      <SettingsGroup
        title="Sesiones activas"
        icon={<Smartphone size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <div
          className="flex items-center justify-between py-3"
          style={{ borderTop: "1px solid var(--bg-muted)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                Este dispositivo
              </p>
              <span className="chip chip--ok">Actual</span>
            </div>
            <p className="caption">
              Última actividad ahora · navegador actual
            </p>
          </div>
        </div>
        <p
          className="caption mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Gestión de múltiples dispositivos en desarrollo.
        </p>
      </SettingsGroup>

      {/* Exportar datos */}
      <SettingsGroup
        title="Exportar mis datos"
        icon={<Download size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <SettingRow
          label="Descargar todos mis datos"
          desc="Asignaturas, entregables, sesiones, mensajes YLEOS en JSON"
        >
          <button onClick={exportData} className="btn btn-secondary btn-sm">
            Solicitar
          </button>
        </SettingRow>
      </SettingsGroup>

      {/* Cerrar sesión */}
      <SettingsGroup
        title="Cerrar sesión"
        icon={<LogOut size={14} style={{ color: "var(--text-tertiary)" }} />}
      >
        <button onClick={handleLogout} className="btn btn-secondary">
          <LogOut size={14} />
          Cerrar sesión en este dispositivo
        </button>
      </SettingsGroup>

      {/* Zona de peligro */}
      <SettingsGroup
        title="Zona de peligro"
        icon={
          <AlertTriangle size={14} style={{ color: "var(--accent-urgent)" }} />
        }
        danger
      >
        <SettingRow
          label="Archivar semestre actual"
          desc="Mueve las asignaturas activas al histórico. No se pueden entregables nuevos."
        >
          <button className="btn btn-secondary btn-sm">
            <Archive size={14} />
            Archivar
          </button>
        </SettingRow>
        <div
          className="pt-3"
          style={{ borderTop: "1px solid var(--bg-muted)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>
                Eliminar mi cuenta
              </p>
              <p className="caption">
                Acción irreversible. Todos tus datos se borrarán.
              </p>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  border: "1px solid var(--accent-urgent)",
                  color: "var(--accent-urgent)",
                }}
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    alert(
                      "Para eliminar cuenta, contacta a soporte. Función manual por seguridad."
                    )
                  }
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "var(--accent-urgent)",
                    color: "#fff",
                  }}
                >
                  Confirmar eliminación
                </button>
              </div>
            )}
          </div>
        </div>
        <p
          className="caption mt-4 p-3 rounded-lg"
          style={{
            backgroundColor: "rgba(216, 90, 48, 0.08)",
            color: "var(--text-secondary)",
          }}
        >
          Antes de eliminar, considera exportar tus datos primero.
        </p>
      </SettingsGroup>
    </div>
  );
}
