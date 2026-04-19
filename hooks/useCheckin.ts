"use client";

import { useState, useCallback } from "react";
import type { Checkin } from "@/types/database";

export function useCheckin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckin = useCallback(
    async (
      blockId: string,
      mood: number,
      progress: number,
      note?: string
    ): Promise<Checkin | null> => {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/focus-blocks/${blockId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, progress, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return null;
      }
      setLoading(false);
      return data.checkin;
    },
    []
  );

  return { loading, error, submitCheckin };
}
