interface SettingsGroupProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}

export function SettingsGroup({
  title,
  icon,
  children,
  danger,
}: SettingsGroupProps) {
  return (
    <div
      className="card"
      style={{
        borderLeft: danger ? "3px solid var(--accent-urgent)" : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <p
          className="label"
          style={{ color: danger ? "var(--accent-urgent)" : undefined }}
        >
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

export function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderTop: "1px solid var(--bg-muted)" }}
    >
      <div className="flex-1 pr-4">
        <p style={{ fontSize: "var(--fs-body)", fontWeight: 500 }}>{label}</p>
        {desc && <p className="caption mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function TileGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2">{children}</div>;
}

export function Tile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg p-3 transition-all"
      style={{
        backgroundColor: selected ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: `1px solid ${selected ? "var(--accent-primary)" : "var(--bg-muted)"}`,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
