// Map custom hex color (from DB) to the closest v5 palette slot
// Fallback: use the color as-is

const PALETTE_MAP: Record<string, { main: string; bg: string; fg: string }> = {
  "#3E5C76": { main: "var(--subject-6)", bg: "var(--subject-6-bg)", fg: "var(--subject-6-fg)" },
  "#6B8E5F": { main: "var(--subject-7)", bg: "var(--subject-7-bg)", fg: "var(--subject-7-fg)" },
  "#B88A4A": { main: "var(--subject-5)", bg: "var(--subject-5-bg)", fg: "var(--subject-5-fg)" },
  "#A8483A": { main: "var(--subject-3)", bg: "var(--subject-3-bg)", fg: "var(--subject-3-fg)" },
  "#7A5F8C": { main: "var(--subject-1)", bg: "var(--subject-1-bg)", fg: "var(--subject-1-fg)" },
  "#4A7A7A": { main: "var(--subject-2)", bg: "var(--subject-2-bg)", fg: "var(--subject-2-fg)" },
  "#8C6A4A": { main: "var(--subject-5)", bg: "var(--subject-5-bg)", fg: "var(--subject-5-fg)" },
  "#5C6B7A": { main: "var(--subject-6)", bg: "var(--subject-6-bg)", fg: "var(--subject-6-fg)" },
};

export function subjectColors(hex: string | null | undefined) {
  if (!hex) return { main: "var(--accent-primary)", bg: "var(--bg-muted)", fg: "var(--text-primary)" };
  const mapped = PALETTE_MAP[hex];
  if (mapped) return mapped;
  return { main: hex, bg: hex + "15", fg: hex };
}
