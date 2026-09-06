import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, accountTypeLabel } from "@/lib/format";
import { TransactionFormDialog } from "@/components/dashboard/transaction-form-dialog";
import { TransactionListItem } from "@/components/dashboard/transaction-list-item";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account || account.userId !== user.id) {
    notFound();
  }

  const [accounts, categories, transactions] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id, archived: false }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { accountId: account.id },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

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
          <p className="text-sm text-muted-foreground">{accountTypeLabel(account.type)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
        <TransactionFormDialog
          accounts={accountOptions}
          categories={categoryOptions}
          defaultAccountId={account.id}
        />
      </div>

      <div className="rounded-xl border border-border bg-card px-5">
        {transactions.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma transação nesta conta ainda.
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
                  accountName: account.name,
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
