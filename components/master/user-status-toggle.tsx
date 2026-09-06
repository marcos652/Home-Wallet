"use client";

import { useTransition } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleUserStatus } from "@/lib/actions/users";

export function UserStatusToggle({
  userId,
  status,
}: {
  userId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const [isPending, startTransition] = useTransition();
  const isActive = status === "ACTIVE";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await toggleUserStatus(userId);
            toast.success(isActive ? "Usuário desativado" : "Usuário reativado");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Algo deu errado");
          }
        });
      }}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isActive ? (
        <UserX className="size-3.5" strokeWidth={1.75} />
      ) : (
        <UserCheck className="size-3.5" strokeWidth={1.75} />
      )}
      {isActive ? "Desativar" : "Reativar"}
    </Button>
  );
}
