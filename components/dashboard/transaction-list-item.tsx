"use client";

import { TransactionRow } from "@/components/dashboard/transaction-row";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { DeleteConfirmButton } from "@/components/dashboard/delete-confirm-button";
import { excluirLancamento, type Conta, type Categoria, type Lancamento } from "@/lib/data";

export function TransactionListItem({
  lancamento,
  nomeDaConta,
  nomeDaCategoria,
  contas,
  categorias,
  onMudou,
}: {
  lancamento: Lancamento;
  nomeDaConta: string;
  nomeDaCategoria?: string | null;
  contas: Conta[];
  categorias: Categoria[];
  onMudou: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <TransactionRow
          tx={{
            id: lancamento.id,
            type: lancamento.type,
            amount: lancamento.amount,
            description: lancamento.description,
            date: lancamento.date,
            accountName: nomeDaConta,
            categoryName: nomeDaCategoria,
          }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <TransactionFormDialog
          contas={contas}
          categorias={categorias}
          lancamento={lancamento}
          onSalvo={onMudou}
        />
        <DeleteConfirmButton
          title="Excluir transação"
          description="Essa ação é permanente e ajusta o saldo da conta."
          onConfirm={async () => {
            await excluirLancamento(lancamento);
            onMudou();
          }}
        />
      </div>
    </div>
  );
}
