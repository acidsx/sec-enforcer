"use client";

import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { createClient } from "@/lib/supabase/client";

export function KeyboardShortcuts() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("keyboard_shortcuts_enabled")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (prefs && typeof prefs.keyboard_shortcuts_enabled === "boolean") {
        setEnabled(prefs.keyboard_shortcuts_enabled);
      }
    });
  }, []);

  useKeyboardShortcuts(enabled);
  return null;
}
