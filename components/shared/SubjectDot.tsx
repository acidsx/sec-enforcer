interface SubjectDotProps {
  color: string;
  pulse?: boolean;
  size?: number;
}

export function SubjectDot({ color, pulse = false, size = 8 }: SubjectDotProps) {
  return (
    <span
      className={pulse ? "subject-dot subject-dot--pulse" : "subject-dot"}
      style={{
        ["--subject-color" as string]: color,
        width: `${size}px`,
        height: `${size}px`,
      } as React.CSSProperties}
    />
  );
}
