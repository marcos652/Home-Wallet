"use client";

import { useTransition } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function IconActionButton({
  icon: Icon,
  label,
  variant = "ghost",
  onAction,
  successMessage,
}: {
  icon: LucideIcon;
  label: string;
  variant?: "ghost" | "destructive";
  onAction: () => Promise<void>;
  successMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await onAction();
            if (successMessage) toast.success(successMessage);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Algo deu errado");
          }
        });
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" strokeWidth={1.75} />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
