import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
      }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
