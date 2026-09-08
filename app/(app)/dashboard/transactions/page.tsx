"use client";

import { Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { listarContas, listarCategorias, listarLancamentos, buscarIntegracao } from "@/lib/data";
import { SyncModal } from "@/components/dashboard/sync-modal";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { TransactionListItem } from "@/components/dashboard/transaction-list-item";

export default function TransactionsPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  const { dados, carregando, recarregar } = useAsync(async () => {
    if (!uid) return null;
    const [contas, categorias, lancamentos, integracao] = await Promise.all([
      listarContas(uid),
      listarCategorias(uid),
      listarLancamentos(uid),
      buscarIntegracao(uid),
    ]);
    return { contas, categorias, lancamentos, integracao };
  }, [uid]);

  const contasAtivas = dados?.contas.filter((c) => !c.archived) ?? [];
  const nomeConta = (id: string) => dados?.contas.find((c) => c.id === id)?.name ?? "Conta";
  const nomeCategoria = (id: string | null) =>
    id ? dados?.categorias.find((c) => c.id === id)?.name : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">Todos os seus lançamentos.</p>
        </div>
        {dados && (
          <div className="flex items-center gap-2">
            {dados.integracao?.enabled && (
              <SyncModal
                lastSyncAt={dados.integracao.lastSyncAt}
                onImportou={recarregar}
              />
            )}
            <TransactionFormDialog
              contas={contasAtivas}
              categorias={dados.categorias}
              onSalvo={recarregar}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card px-5">
        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !dados?.lancamentos.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {dados.lancamentos.map((l) => (
              <TransactionListItem
                key={l.id}
                lancamento={l}
                nomeDaConta={nomeConta(l.accountId)}
                nomeDaCategoria={nomeCategoria(l.categoryId)}
                contas={contasAtivas}
                categorias={dados.categorias}
                onMudou={recarregar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
