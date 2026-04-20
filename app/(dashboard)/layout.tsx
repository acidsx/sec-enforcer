import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <main className="app-shell__content">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
