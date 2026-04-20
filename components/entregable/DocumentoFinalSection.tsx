"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Bot,
} from "lucide-react";

interface DocumentoFinalSectionProps {
  entregableId: string;
  documento: any | null;
  lastReview: any | null;
}

export function DocumentoFinalSection({
  entregableId,
  documento,
  lastReview,
}: DocumentoFinalSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no puede superar 10 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entregableId", entregableId);

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al subir");
    }

    setUploading(false);
    window.location.reload();
  }

  async function handleReview() {
    if (!documento) return;
    setReviewing(true);
    setError(null);

    const res = await fetch("/api/documents/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentoId: documento.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al revisar");
    }

    setReviewing(false);
    window.location.reload();
  }

  async function handleMarkDelivered() {
    if (!documento) return;
    await fetch("/api/documents/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentoId: documento.id }),
    });
    window.location.reload();
  }

  const status = documento?.status || "sin_iniciar";
  const verdictColors: Record<string, string> = {
    ready: "var(--ok)",
    needs_work: "var(--warn)",
    critical: "var(--urgent)",
  };
  const verdictLabels: Record<string, string> = {
    ready: "Listo para entregar",
    needs_work: "Necesita trabajo",
    critical: "Crítico",
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "var(--bg-muted)", backgroundColor: "var(--focus-bg)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Documento Final
        </h3>
      </div>

      <div className="p-5 space-y-4">
        {/* No document uploaded */}
        {!documento && (
          <div
            className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition"
            style={{ borderColor: "var(--bg-muted)" }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.pptx"
              onChange={handleUpload}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Sube tu documento final
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              PDF, Word, PowerPoint o texto. Máx 10 MB.
            </p>
          </div>
        )}

        {/* Document uploaded */}
        {documento && status !== "entregado" && (
          <>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {documento.file_name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(documento.file_size_bytes / 1024).toFixed(0)} KB ·{" "}
                  {new Date(documento.uploaded_at).toLocaleDateString("es-CL")}
                </p>
              </div>
              <button
                onClick={() => inputRef.current?.click()}
                className="text-xs rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
              >
                Reemplazar
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.pptx"
                onChange={handleUpload}
                className="hidden"
              />
            </div>

            {/* Review button */}
            {documento.extraction_status === "success" && status !== "revisado" && !reviewing && (
              <button
                onClick={handleReview}
                className="flex items-center gap-2 w-full justify-center rounded-lg py-3 font-semibold text-white transition"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                <Bot className="h-4 w-4" />
                Revisar con YLEOS
              </button>
            )}

            {documento.extraction_status === "unsupported" && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}>
                YLEOS no puede analizar este formato. Sube una versión en PDF o Word para recibir revisión.
              </p>
            )}

            {reviewing && (
              <div className="flex items-center gap-3 justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  YLEOS está revisando tu documento...
                </span>
              </div>
            )}
          </>
        )}

        {/* Review result */}
        {status === "revisado" && lastReview && (
          <div className="space-y-3">
            {/* Verdict badge */}
            {lastReview.metadata?.verdict && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: verdictColors[lastReview.metadata.verdict] || "var(--text-muted)" }}
              >
                {lastReview.metadata.verdict === "ready" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {verdictLabels[lastReview.metadata.verdict] || lastReview.metadata.verdict}
              </div>
            )}

            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {lastReview.content.length > 2000
                ? lastReview.content.substring(0, 2000) + "..."
                : lastReview.content}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Volver a revisar
              </button>
              <button
                onClick={handleMarkDelivered}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--ok)" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar como entregado
              </button>
            </div>
          </div>
        )}

        {/* Delivered */}
        {status === "entregado" && (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" style={{ color: "var(--ok)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--ok)" }}>Entregado</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {documento.file_name} · {new Date(documento.updated_at).toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Subiendo...</span>
          </div>
        )}

        {error && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(168,72,58,0.1)", color: "var(--urgent)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
