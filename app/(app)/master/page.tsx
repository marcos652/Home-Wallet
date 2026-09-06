import { Users, UserCheck, Wallet, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { UserGrowthChart, type MonthlySignups } from "@/components/master/user-growth-chart";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export default async function MasterOverviewPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalUsers, activeUsers, accounts, monthTransactions, recentUsers] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
    prisma.account.findMany({ where: { user: { role: "USER" } } }),
    prisma.transaction.findMany({
      where: { account: { user: { role: "USER" } }, date: { gte: monthStart } },
    }),
    prisma.user.findMany({
      where: { role: "USER", createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthVolume = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const months: MonthlySignups[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d);
    months.push({ month: label.replace(".", ""), count: 0 });
  }
  for (const user of recentUsers) {
    const diffMonths =
      (now.getFullYear() - user.createdAt.getFullYear()) * 12 +
      (now.getMonth() - user.createdAt.getMonth());
    const index = 5 - diffMonths;
    if (index >= 0 && index < months.length) {
      months[index].count += 1;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Métricas da plataforma</h1>
        <p className="text-sm text-muted-foreground">Visão geral de todos os usuários.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuários" value={String(totalUsers)} icon={Users} />
        <StatCard label="Usuários ativos" value={String(activeUsers)} icon={UserCheck} />
        <StatCard label="Saldo total na plataforma" value={formatCurrency(totalBalance)} icon={Wallet} />
        <StatCard label="Volume movimentado (mês)" value={formatCurrency(monthVolume)} icon={Activity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novos usuários (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <UserGrowthChart data={months} />
        </CardContent>
      </Card>
    </div>
  );
}
