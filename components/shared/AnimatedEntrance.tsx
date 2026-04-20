"use client";

interface AnimatedEntranceProps {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedEntrance({
  delay = 0,
  children,
  className = "",
}: AnimatedEntranceProps) {
  return (
    <div
      className={`riseup ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
