"use client";

import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";
import { formatCurrency, accountTypeLabel } from "@/lib/format";
import { AccountFormDialog } from "@/components/dashboard/account-form-dialog";
import { IconActionButton } from "@/components/dashboard/icon-action-button";
import { DeleteConfirmButton } from "@/components/dashboard/delete-confirm-button";
import { alternarArquivada, excluirConta, type Conta } from "@/lib/data";

export function AccountCard({ account, onMudou }: { account: Conta; onMudou: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/accounts/${account.id}`} className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{accountTypeLabel(account.type)}</p>
          <p className="truncate text-base font-medium hover:underline">{account.name}</p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <AccountFormDialog account={account} onSalvo={onMudou} />
          <IconActionButton
            icon={account.archived ? ArchiveRestore : Archive}
            label={account.archived ? "Reativar conta" : "Arquivar conta"}
            onAction={async () => {
              await alternarArquivada(account.id, account.archived);
              onMudou();
            }}
            successMessage={account.archived ? "Conta reativada" : "Conta arquivada"}
          />
          <DeleteConfirmButton
            title="Excluir conta"
            description="Essa ação é permanente e também remove todas as transações desta conta."
            onConfirm={async () => {
              await excluirConta(account.id);
              onMudou();
            }}
          />
        </div>
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {formatCurrency(account.balance, account.currency)}
      </p>
    </div>
  );
}
