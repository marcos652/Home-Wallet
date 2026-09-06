import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUserRecord } from "@/lib/session";

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveUserRecord();
  if (user.role !== "MASTER") {
    redirect("/dashboard");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
