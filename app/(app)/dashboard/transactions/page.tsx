import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { TransactionListItem } from "@/components/dashboard/transaction-list-item";
import { SyncModal } from "@/components/dashboard/sync-modal";

export default async function TransactionsPage() {
  const user = await requireUser();

  const [accounts, categories, transactions, integration] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { account: { userId: user.id } },
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.emailIntegration.findUnique({ where: { userId: user.id } }),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">Todos os seus lançamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          {integration?.enabled && (
            <SyncModal
              lastSyncAt={integration.lastSyncAt}
              lastSyncError={integration.lastSyncError}
            />
          )}
          <TransactionFormDialog accounts={accountOptions} categories={categoryOptions} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card px-5">
        {transactions.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <TransactionListItem
                key={tx.id}
                tx={{
                  id: tx.id,
                  type: tx.type,
                  amount: tx.amount,
                  description: tx.description,
                  date: tx.date,
                  accountName: tx.account.name,
                  categoryName: tx.category?.name,
                  categoryColor: tx.category?.color,
                  accountId: tx.accountId,
                  categoryId: tx.categoryId,
                }}
                accounts={accountOptions}
                categories={categoryOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
