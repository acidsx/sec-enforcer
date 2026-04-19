"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
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

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || streaming) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!text) setInput("");
    setStreaming(true);

    // Add empty model message for streaming
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

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
        <Bot className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold text-accent tracking-wide">
          YLEOS
        </span>
        <span className="text-xs text-muted ml-1">Protocolo Activo</span>
      </div>

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
              {streaming && i === messages.length - 1 && msg.role === "model" && (
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
