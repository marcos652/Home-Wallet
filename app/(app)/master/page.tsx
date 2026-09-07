"use client";

import { Users, UserCheck, Wallet, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { UserGrowthChart, type MonthlySignups } from "@/components/master/user-growth-chart";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { Falhou } from "@/components/dashboard/estado";
import { listarUsuarios, contasDoUsuario, lancamentosDoUsuario } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default function MasterOverviewPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  // O Firestore não agrega no banco: buscamos tudo e somamos aqui no cliente.
  const { dados, carregando, erro } = useAsync(async () => {
    if (!uid) return null;
    const usuarios = await listarUsuarios();
    const carteiras = await Promise.all(
      usuarios.map(async (u) => {
        const [contas, lancamentos] = await Promise.all([
          contasDoUsuario(u.id),
          lancamentosDoUsuario(u.id, 500),
        ]);
        return { contas, lancamentos };
      }),
    );
    return { usuarios, carteiras };
  }, [uid]);

  if (erro) return <Falhou erro={erro} />;
  if (carregando || !dados) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { usuarios, carteiras } = dados;

  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const totalUsers = usuarios.length;
  const activeUsers = usuarios.filter((u) => u.status === "ACTIVE").length;
  const totalBalance = carteiras.reduce(
    (soma, c) => soma + c.contas.reduce((s, a) => s + a.balance, 0),
    0,
  );
  const monthVolume = carteiras.reduce(
    (soma, c) =>
      soma +
      c.lancamentos.filter((l) => l.date >= inicioDoMes).reduce((s, l) => s + l.amount, 0),
    0,
  );

  const months: MonthlySignups[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d);
    months.push({ month: label.replace(".", ""), count: 0 });
  }
  for (const usuario of usuarios) {
    const diffMonths =
      (agora.getFullYear() - usuario.createdAt.getFullYear()) * 12 +
      (agora.getMonth() - usuario.createdAt.getMonth());
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
