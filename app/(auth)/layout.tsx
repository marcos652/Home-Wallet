import { PiggyBank } from "lucide-react";
import { redirect } from "next/navigation";
import { getActiveUserRecord } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getActiveUserRecord();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary">
            <PiggyBank className="size-6 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Home Wallet</span>
        </div>
        {children}
      </div>
    </div>
  );
}
