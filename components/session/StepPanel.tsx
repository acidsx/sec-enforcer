"use client";

interface StepPanelProps {
  stepTitle: string;
  stepDescription: string | null;
  rubricSummary: string | null;
}

export function StepPanel({
  stepTitle,
  stepDescription,
  rubricSummary,
}: StepPanelProps) {
  return (
    <div
      className="h-full overflow-y-auto px-6 py-5"
      style={{ backgroundColor: "var(--focus-surface)" }}
    >
      <h2
        className="text-lg font-semibold leading-snug"
        style={{
          color: "var(--text-primary)",
          fontFamily: "'Source Serif 4', 'Lora', 'Merriweather', serif",
        }}
      >
        {stepTitle}
      </h2>

      {stepDescription && (
        <p
          className="mt-4 text-base leading-7"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "'Source Serif 4', 'Lora', 'Merriweather', serif",
            fontSize: "18px",
            lineHeight: "1.7",
          }}
        >
          {stepDescription}
        </p>
      )}

      {rubricSummary && (
        <div
          className="mt-6 rounded-lg px-4 py-3"
          style={{
            backgroundColor: "var(--bg-muted)",
            border: "1px solid var(--bg-muted)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Criterios de evaluación
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "'Source Serif 4', 'Lora', 'Merriweather', serif",
            }}
          >
            {rubricSummary}
          </p>
        </div>
      )}
    </div>
  );
}
