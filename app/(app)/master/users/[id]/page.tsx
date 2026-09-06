import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet, Layers, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { UserStatusToggle } from "@/components/master/user-status-toggle";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, accountTypeLabel, initials } from "@/lib/format";

export default async function MasterUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user || user.role !== "USER") {
    notFound();
  }

  const [transactionCount, recentTransactions] = await Promise.all([
    prisma.transaction.count({ where: { account: { userId: user.id } } }),
    prisma.transaction.findMany({
      where: { account: { userId: user.id } },
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const totalBalance = user.accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/master/users"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Usuários
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
              <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                {user.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.email} · desde {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <UserStatusToggle userId={user.id} status={user.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Saldo total" value={formatCurrency(totalBalance)} icon={Wallet} />
        <StatCard label="Contas" value={String(user.accounts.length)} icon={Layers} />
        <StatCard label="Transações" value={String(transactionCount)} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {user.accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.accounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <span className="text-sm text-muted-foreground">{accountTypeLabel(account.type)}</span>
                  <span className="text-sm font-medium">{account.name}</span>
                  <span className="mt-1 text-lg font-semibold tabular-nums">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transações recentes</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {recentTransactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma transação registrada</p>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow
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
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
