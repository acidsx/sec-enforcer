"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, BookOpen, User } from "lucide-react";
import type { TutorContext } from "@/lib/yleos/prompts/tutor-system";

interface Message {
  role: "user" | "model";
  content: string;
  messageRole?: string;
}

interface ChatTutorProps {
  tutorContext: TutorContext;
  sessionId: string;
}

export function ChatTutor({ tutorContext, sessionId }: ChatTutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastStudentMessageRef = useRef<number>(Date.now());
  const reengageCountRef = useRef(0);
  const reengageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-open with socratic greeting
  useEffect(() => {
    sendMessage(
      `Estoy comenzando mi sesión de trabajo. Mi paso actual es: "${tutorContext.stepTitle}".`
    );
  }, []);

  // Inactivity detection — only by absence of messages, never by system input
  useEffect(() => {
    reengageTimerRef.current = setInterval(async () => {
      const elapsed = (Date.now() - lastStudentMessageRef.current) / 1000 / 60;
      if (
        elapsed >= 4 &&
        reengageCountRef.current < 2 &&
        !streaming
      ) {
        reengageCountRef.current++;
        try {
          const res = await fetch("/api/yleos/reengage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.message) {
            setMessages((prev) => [
              ...prev,
              { role: "model", content: data.message, messageRole: "micro_break" },
            ]);
          }
        } catch {}
        lastStudentMessageRef.current = Date.now(); // Reset after reengage
      }
    }, 30000); // Check every 30s

    return () => {
      if (reengageTimerRef.current) clearInterval(reengageTimerRef.current);
    };
  }, [sessionId, streaming]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || streaming) return;

      lastStudentMessageRef.current = Date.now();

      const userMessage: Message = { role: "user", content: messageText, messageRole: "student" };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      if (!text) setInput("");
      setStreaming(true);

      const modelMessage: Message = { role: "model", content: "", messageRole: "scaffolding" };
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
            tutorContext,
            sessionId,
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
    },
    [input, messages, streaming, tutorContext, sessionId]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "model" && (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1"
                style={{ backgroundColor: "var(--accent-primary)", opacity: 0.15 }}
              >
                <BookOpen
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--accent-primary)" }}
                />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.messageRole === "micro_break" ? "border border-dashed" : ""
              }`}
              style={{
                backgroundColor:
                  msg.role === "user"
                    ? "var(--accent-primary)"
                    : "var(--bg-surface)",
                color:
                  msg.role === "user" ? "#fff" : "var(--text-primary)",
                fontFamily:
                  msg.role === "model"
                    ? "'Source Serif 4', 'Lora', 'Merriweather', serif"
                    : "inherit",
                borderColor:
                  msg.messageRole === "micro_break"
                    ? "var(--warn)"
                    : "transparent",
              }}
            >
              {msg.content}
              {streaming &&
                i === messages.length - 1 &&
                msg.role === "model" && (
                  <span
                    className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  />
                )}
            </div>
            {msg.role === "user" && (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <User
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--bg-muted)",
        }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{
              backgroundColor: "var(--focus-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--bg-muted)",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition disabled:opacity-30"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
            }}
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
