import { MomentPills } from "@/components/shell/MomentPills";
import { AppHeader } from "@/components/shell/AppHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <AppHeader />
      <div className="shell__content">{children}</div>
      <MomentPills />
    </div>
  );
}
