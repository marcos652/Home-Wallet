"use client";

import { PiggyBank } from "lucide-react";
import { PrimaryNav, SettingsNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { useFirebase } from "@/components/auth/firebase-provider";
import { initials } from "@/lib/format";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { perfil } = useFirebase();
  if (!perfil) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <PiggyBank className="size-[18px] text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            Home Wallet
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <PrimaryNav role={perfil.role} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <SettingsNav role={perfil.role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 md:px-8">
          <div className="flex items-center gap-2">
            <MobileNav role={perfil.role} />
            <div className="flex items-center gap-2 md:hidden">
              <PiggyBank className="size-5 text-primary" strokeWidth={1.75} />
              <span className="text-sm font-semibold">Home Wallet</span>
            </div>
          </div>
          <UserMenu name={perfil.name} email={perfil.email} initials={initials(perfil.name)} />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
