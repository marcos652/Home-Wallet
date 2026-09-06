import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "income" | "expense";
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            tone === "income" && "text-income",
            tone === "expense" && "text-expense",
          )}
        >
          {value}
        </span>
      </div>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone === "income" && "bg-income/10 text-income",
          tone === "expense" && "bg-expense/10 text-expense",
          tone === "default" && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </div>
    </div>
  );
}
