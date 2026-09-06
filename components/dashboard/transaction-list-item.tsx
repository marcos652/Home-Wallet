"use client";

import { TransactionRow, type TransactionRowData } from "@/components/dashboard/transaction-row";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { DeleteConfirmButton } from "@/components/dashboard/delete-confirm-button";
import { deleteTransaction } from "@/lib/actions/transactions";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export function TransactionListItem({
  tx,
  accounts,
  categories,
}: {
  tx: TransactionRowData & { accountId: string; categoryId: string | null };
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <TransactionRow tx={tx} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <TransactionFormDialog
          accounts={accounts}
          categories={categories}
          transaction={{
            id: tx.id,
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            type: tx.type as "INCOME" | "EXPENSE",
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
          }}
        />
        <DeleteConfirmButton
          title="Excluir transação"
          description="Essa ação é permanente e ajusta o saldo da conta."
          onConfirm={() => deleteTransaction(tx.id)}
        />
      </div>
    </div>
  );
}
