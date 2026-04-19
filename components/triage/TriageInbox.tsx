"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Mail,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  Inbox,
} from "lucide-react";
import { syncOutlookInbox, approveAndSend, discardDraft } from "@/app/(dashboard)/triage/actions";

interface Draft {
  id: string;
  source_subject: string;
  source_from: string;
  source_snippet: string;
  source_received_at: string;
  draft_body: string;
  status: string;
  work_context_id: string | null;
  work_context?: { name: string; color: string } | null;
}

export function TriageInbox() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Auto-cancel confirm after 3 seconds
  useEffect(() => {
    if (!confirmingId) return;
    const timer = setTimeout(() => setConfirmingId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmingId]);

  async function fetchDrafts() {
    setLoading(true);
    const res = await fetch("/api/outlook-drafts");
    const data = await res.json();
    if (res.ok) setDrafts(data.drafts || []);
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    const result = await syncOutlookInbox();
    if (result.error) {
      setSyncResult(`Error: ${result.error}`);
    } else {
      setSyncResult(
        `${result.scanned} escaneados · ${result.drafted} triageados · ${result.skipped} ignorados`
      );
      fetchDrafts();
    }
    setSyncing(false);
  }

  async function handleSend(draftId: string) {
    if (confirmingId !== draftId) {
      setConfirmingId(draftId);
      return;
    }

    setSendingId(draftId);
    setConfirmingId(null);
    const result = await approveAndSend(draftId);
    if (result.ok) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId ? { ...d, status: "sent" } : d
        )
      );
    }
    setSendingId(null);
  }

  async function handleDiscard(draftId: string) {
    await discardDraft(draftId);
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId ? { ...d, status: "discarded" } : d
      )
    );
  }

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const processedDrafts = drafts.filter((d) => d.status !== "pending");

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Sync button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triaje de Correos</h1>
          <p className="mt-1 text-muted">
            YLEOS clasifica y redacta respuestas para tus correos
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-dim transition disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sincronizar Outlook
        </button>
      </div>

      {syncResult && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm ${
            syncResult.startsWith("Error")
              ? "bg-red-400/10 text-red-400"
              : "bg-green-400/10 text-green-400"
          }`}
        >
          {syncResult}
        </div>
      )}

      {/* Pending drafts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : pendingDrafts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Inbox className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">
            Sin borradores pendientes. Sincroniza Outlook para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingDrafts.map((draft) => {
            const isExpanded = expandedId === draft.id;
            const currentBody =
              editedBody[draft.id] ?? draft.draft_body;

            return (
              <div
                key={draft.id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : draft.id)
                  }
                  className="flex items-center gap-4 w-full px-4 py-3 text-left hover:bg-surface-2 transition"
                >
                  <Mail className="h-4 w-4 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {draft.source_from}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {draft.source_subject}
                    </p>
                  </div>
                  {draft.work_context && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${draft.work_context.color}20`,
                        color: draft.work_context.color,
                      }}
                    >
                      {draft.work_context.name}
                    </span>
                  )}
                  <span className="text-xs text-muted shrink-0">
                    {draft.source_received_at
                      ? formatDate(draft.source_received_at)
                      : ""}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    {/* Original message */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
                        Mensaje Original
                      </p>
                      <p className="text-sm text-muted bg-surface-2 rounded-lg px-3 py-2">
                        {draft.source_snippet}
                      </p>
                    </div>

                    {/* Draft response (editable) */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
                        Borrador de Respuesta (YLEOS)
                      </p>
                      <textarea
                        value={currentBody}
                        onChange={(e) =>
                          setEditedBody((prev) => ({
                            ...prev,
                            [draft.id]: e.target.value,
                          }))
                        }
                        rows={6}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none resize-y"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSend(draft.id)}
                        disabled={sendingId === draft.id}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          confirmingId === draft.id
                            ? "bg-green-600 text-white animate-pulse"
                            : "bg-green-600/10 text-green-400 hover:bg-green-600/20"
                        }`}
                      >
                        {sendingId === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {confirmingId === draft.id
                          ? "Click para confirmar envío"
                          : "Aprobar y Enviar"}
                      </button>
                      <button
                        onClick={() => handleDiscard(draft.id)}
                        className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
                      >
                        <X className="h-4 w-4" />
                        Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Processed drafts */}
      {processedDrafts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
            Procesados
          </h2>
          <div className="space-y-1">
            {processedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm opacity-60"
              >
                {draft.status === "sent" ? (
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted shrink-0" />
                )}
                <span className="truncate">{draft.source_subject}</span>
                <span className="text-xs text-muted shrink-0 capitalize">
                  {draft.status === "sent" ? "Enviado" : "Descartado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
