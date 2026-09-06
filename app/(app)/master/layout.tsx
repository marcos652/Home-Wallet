import { AppShell } from "@/components/layout/app-shell";
import { Guard } from "@/components/auth/guard";

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard papel="MASTER">
      <AppShell>{children}</AppShell>
    </Guard>
  );
}
