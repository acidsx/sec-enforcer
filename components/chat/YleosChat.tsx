"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import type { SessionContext } from "@/lib/yleos/gemini";

interface Message {
  role: "user" | "model";
  content: string;
}

interface YleosChatProps {
  sessionContext: SessionContext;
}

export function YleosChat({ sessionContext }: YleosChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [advances, setAdvances] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-greet on mount
  useEffect(() => {
    sendMessage(
      `Estoy comenzando mi bloque de enfoque de 25 minutos. Mi paso actual es: "${sessionContext.stepTitle}". ¿Cómo arrancamos?`
    );
  }, []);

  // Extract advances from YLEOS responses
  function extractAdvances(text: string) {
    const advancePatterns = [
      /(?:avance|progreso|logro|completado|definido|redactado|estructurado|investigado|analizado|desarrollado)[:\s]+(.+?)(?:\.|$)/gi,
      /(?:ya tenemos|hemos logrado|se completó|quedó listo)[:\s]*(.+?)(?:\.|$)/gi,
    ];

    const newAdvances: string[] = [];
    for (const pattern of advancePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const advance = match[1].trim();
        if (advance.length > 10 && advance.length < 120) {
          newAdvances.push(advance);
        }
      }
    }
    return newAdvances;
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || streaming) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!text) setInput("");
    setStreaming(true);

    const modelMessage: Message = { role: "model", content: "" };
    setMessages([...updatedMessages, modelMessage]);

    try {
      const res = await fetch("/api/yleos/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "model",
            content: `Error: ${err.error || "No se pudo conectar con YLEOS"}`,
          };
          return copy;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setStreaming(false);
        return;
      }

      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "model", content: accumulated };
          return copy;
        });
      }

      // Extract advances from the complete response
      const newAdvances = extractAdvances(accumulated);
      if (newAdvances.length > 0) {
        setAdvances((prev) => [...prev, ...newAdvances]);
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "model",
          content: "Error de conexión con YLEOS. Intenta de nuevo.",
        };
        return copy;
      });
    }

    setStreaming(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const daysLeft = Math.ceil(
    (new Date(sessionContext.dueDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-surface overflow-hidden">
      {/* Header with context */}
      <div className="border-b border-border bg-surface-2">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Bot className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-accent tracking-wide">
            YLEOS
          </span>
          <span className="text-xs text-muted ml-1">Protocolo Activo</span>
        </div>
        {/* Session info bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border/50 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {sessionContext.stepTitle}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={daysLeft <= 3 ? "text-red-400 font-medium" : ""}>
              {daysLeft}d restantes
            </span>
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {sessionContext.progress}%
          </span>
        </div>
      </div>

      {/* Advances panel (if any) */}
      {advances.length > 0 && (
        <div className="border-b border-border bg-green-400/5 px-4 py-2">
          <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">
            Avances de esta sesión
          </p>
          <div className="space-y-0.5">
            {advances.map((a, i) => (
              <p key={i} className="text-[11px] text-green-300/80 flex gap-1.5">
                <span className="text-green-400">+</span>
                {a}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "model" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent/10 text-foreground"
                  : "bg-surface-2 text-foreground"
              }`}
            >
              {msg.content}
              {streaming &&
                i === messages.length - 1 &&
                msg.role === "model" && (
                  <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse" />
                )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2">
                <User className="h-3.5 w-3.5 text-muted" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe a YLEOS..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-dim transition disabled:opacity-30"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
