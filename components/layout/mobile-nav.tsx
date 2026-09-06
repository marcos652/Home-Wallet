"use client";

import { useState } from "react";
import { Menu, PiggyBank } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PrimaryNav, SettingsNav } from "@/components/layout/sidebar-nav";

export function MobileNav({ role }: { role: "MASTER" | "USER" }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" strokeWidth={1.75} />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <PiggyBank className="size-[18px] text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Home Wallet</span>
        </div>
        <div className="py-2" onClick={() => setOpen(false)}>
          <PrimaryNav role={role} />
        </div>
        <div className="mt-auto border-t border-sidebar-border p-3" onClick={() => setOpen(false)}>
          <SettingsNav role={role} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
