"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative rounded-full transition-all shrink-0"
      style={{
        width: "40px",
        height: "22px",
        backgroundColor: checked
          ? "var(--accent-primary)"
          : "var(--bg-muted)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="absolute rounded-full transition-all"
        style={{
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px",
          height: "16px",
          backgroundColor: "#fff",
        }}
      />
    </button>
  );
}
