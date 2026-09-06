"use client";

import { Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { listarContas } from "@/lib/data";
import { AccountFormDialog } from "@/components/dashboard/account-form-dialog";
import { AccountCard } from "@/components/dashboard/account-card";

export default function AccountsPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  const { dados: contas, carregando, recarregar } = useAsync(
    async () => (uid ? listarContas(uid) : []),
    [uid],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas e carteiras.</p>
        </div>
        <AccountFormDialog onSalvo={recarregar} />
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !contas?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Você ainda não tem contas cadastradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((conta) => (
            <AccountCard key={conta.id} account={conta} onMudou={recarregar} />
          ))}
        </div>
      )}
    </div>
  );
}
