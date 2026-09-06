"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import {
  buscarConta,
  listarContas,
  listarCategorias,
  listarLancamentosDaConta,
} from "@/lib/data";
import { formatCurrency, accountTypeLabel } from "@/lib/format";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { TransactionListItem } from "@/components/dashboard/transaction-list-item";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  const { dados, carregando, recarregar } = useAsync(async () => {
    if (!uid) return null;
    const [conta, contas, categorias, lancamentos] = await Promise.all([
      buscarConta(id),
      listarContas(uid),
      listarCategorias(uid),
      listarLancamentosDaConta(id),
    ]);
    return { conta, contas, categorias, lancamentos };
  }, [uid, id]);

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dados?.conta) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Conta não encontrada.</p>
        <Link href="/dashboard/accounts" className="text-sm text-primary hover:underline">
          Voltar para contas
        </Link>
      </div>
    );
  }

  const { conta, contas, categorias, lancamentos } = dados;
  const contasAtivas = contas.filter((c) => !c.archived);
  const nomeCategoria = (cid: string | null) =>
    cid ? categorias.find((c) => c.id === cid)?.name : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/accounts"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Contas
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{accountTypeLabel(conta.type)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{conta.name}</h1>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatCurrency(conta.balance, conta.currency)}
          </p>
        </div>
        <TransactionFormDialog
          contas={contasAtivas}
          categorias={categorias}
          contaPadrao={conta.id}
          onSalvo={recarregar}
        />
      </div>

      <div className="rounded-xl border border-border bg-card px-5">
        {lancamentos.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma transação nesta conta ainda.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {lancamentos.map((l) => (
              <TransactionListItem
                key={l.id}
                lancamento={l}
                nomeDaConta={conta.name}
                nomeDaCategoria={nomeCategoria(l.categoryId)}
                contas={contasAtivas}
                categorias={categorias}
                onMudou={recarregar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
