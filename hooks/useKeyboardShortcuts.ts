"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts(enabled: boolean = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function handleKey(e: KeyboardEvent) {
      // Don't fire while typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key === "Escape") target.blur();
        return;
      }

      // Ignore with modifiers (except Cmd/Ctrl+K)
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          // TODO: Command palette
          console.log("Cmd+K: command palette (próximamente)");
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "h":
          router.push("/");
          break;
        case "p":
          router.push("/planificar");
          break;
        case "e":
          router.push("/entregar");
          break;
        case "a":
          router.push("/ajustes");
          break;
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [enabled, router]);
}
