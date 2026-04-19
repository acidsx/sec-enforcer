"use client";

import { useState, useCallback } from "react";
import type { FocusBlock } from "@/types/database";

export function useFocusBlock() {
  const [block, setBlock] = useState<FocusBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (stepId?: string, plannedMinutes = 25) => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/focus-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, plannedMinutes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return null;
      }
      setBlock(data.block);
      setLoading(false);
      return data.block as FocusBlock;
    },
    []
  );

  const startBlock = useCallback(async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/focus-blocks/${id}/start`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return null;
    }
    setBlock(data.block);
    setLoading(false);
    return data.block as FocusBlock;
  }, []);

  const endBlock = useCallback(
    async (id: string, status: "completed" | "abandoned" = "completed", notes?: string) => {
      setLoading(true);
      const res = await fetch(`/api/focus-blocks/${id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return null;
      }
      setBlock(data.block);
      setLoading(false);
      return data.block as FocusBlock;
    },
    []
  );

  return { block, loading, error, create, startBlock, endBlock };
}
