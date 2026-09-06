import { AppShell } from "@/components/layout/app-shell";
import { Guard } from "@/components/auth/guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard papel="USER">
      <AppShell>{children}</AppShell>
    </Guard>
  );
}
