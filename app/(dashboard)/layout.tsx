import { MomentPills } from "@/components/shell/MomentPills";
import { AppHeader } from "@/components/shell/AppHeader";
import { KeyboardShortcuts } from "@/components/shell/KeyboardShortcuts";
import { PageTransition } from "@/components/shell/PageTransition";
import { ServiceWorkerRegister } from "@/components/shell/ServiceWorkerRegister";
import { ToastProvider } from "@/components/shared/MicroToast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="shell">
        <AppHeader />
        <div className="shell__content">
          <PageTransition>{children}</PageTransition>
        </div>
        <MomentPills />
        <KeyboardShortcuts />
        <ServiceWorkerRegister />
      </div>
    </ToastProvider>
  );
}
