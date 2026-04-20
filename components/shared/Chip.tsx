interface ChipProps {
  variant?: "default" | "urgent" | "warn" | "info" | "ok";
  dot?: string;
  children: React.ReactNode;
}

export function Chip({ variant = "default", dot, children }: ChipProps) {
  const className = variant === "default" ? "chip" : `chip chip--${variant}`;
  return (
    <span className={className}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1"
          style={{ backgroundColor: dot }}
        />
      )}
      {children}
    </span>
  );
}
