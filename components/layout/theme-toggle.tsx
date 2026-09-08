"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema claro e escuro"
    >
      {/* Qual ícone aparece é decidido pelo CSS, não por estado: no servidor não
          se sabe o tema do visitante, e usar estado faria o ícone piscar. */}
      <Moon className="size-[18px] dark:hidden" strokeWidth={1.75} />
      <Sun className="hidden size-[18px] dark:block" strokeWidth={1.75} />
    </Button>
  );
}
