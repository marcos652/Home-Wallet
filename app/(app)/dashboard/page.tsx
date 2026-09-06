import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Scale, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CategoryBreakdownChart, type CategorySlice } from "@/components/dashboard/category-breakdown-chart";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, accountTypeLabel } from "@/lib/format";

export default async function DashboardOverviewPage() {
  const user = await requireUser();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [accounts, monthTransactions, recentTransactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { account: { userId: user.id }, date: { gte: monthStart } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { account: { userId: user.id } },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      take: 6,
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthIncome = monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = new Map<string, CategorySlice>();
  for (const t of monthTransactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category?.name ?? "Sem categoria";
    const color = t.category?.color ?? "#64748b";
    const existing = expenseByCategory.get(key);
    if (existing) {
      existing.value += t.amount;
    } else {
      expenseByCategory.set(key, { name: key, value: t.amount, color });
    }
  }
  const categorySlices = Array.from(expenseByCategory.values()).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo das suas finanças.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo total" value={formatCurrency(totalBalance)} icon={Wallet} />
        <StatCard label="Receitas do mês" value={formatCurrency(monthIncome)} icon={TrendingUp} tone="income" />
        <StatCard label="Despesas do mês" value={formatCurrency(monthExpense)} icon={TrendingDown} tone="expense" />
        <StatCard
          label="Resultado do mês"
          value={formatCurrency(monthIncome - monthExpense)}
          icon={Scale}
          tone={monthIncome - monthExpense >= 0 ? "income" : "expense"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={categorySlices} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Últimas transações</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/transactions" />}
            >
              Ver todas <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {recentTransactions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma transação ainda
              </p>
            )}
            {recentTransactions.map((tx) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Contas</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/accounts" />}
          >
            Gerenciar <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não tem contas cadastradas
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-1 rounded-lg border border-border p-4"
                >
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
    </div>
  );
}
