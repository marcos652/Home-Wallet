import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUserRecord } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveUserRecord();
  if (user.role === "MASTER") {
    redirect("/master");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
