"use client";

import { useTransition } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarStatusUsuario } from "@/lib/data";

export function UserStatusToggle({
  userId,
  status,
  onMudou,
}: {
  userId: string;
  status: "ACTIVE" | "INACTIVE";
  onMudou: () => void;
}) {
  const [pendente, iniciar] = useTransition();
  const ativo = status === "ACTIVE";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pendente}
      onClick={() => {
        iniciar(async () => {
          try {
            await alternarStatusUsuario(userId, status);
            toast.success(ativo ? "Usuário desativado" : "Usuário reativado");
            onMudou();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Algo deu errado");
          }
        });
      }}
    >
      {pendente ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : ativo ? (
        <UserX className="size-3.5" strokeWidth={1.75} />
      ) : (
        <UserCheck className="size-3.5" strokeWidth={1.75} />
      )}
      {ativo ? "Desativar" : "Reativar"}
    </Button>
  );
}
