import { MomentPills } from "@/components/shell/MomentPills";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <div className="shell__content">{children}</div>
      <MomentPills />
    </div>
  );
}
