"use client";

import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Scale, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CategoryBreakdownChart,
  type CategorySlice,
} from "@/components/dashboard/category-breakdown-chart";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { listarContas, listarCategorias, listarLancamentos } from "@/lib/data";
import { formatCurrency, accountTypeLabel } from "@/lib/format";

export default function DashboardOverviewPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  const { dados, carregando } = useAsync(async () => {
    if (!uid) return null;
    const [contas, categorias, lancamentos] = await Promise.all([
      listarContas(uid),
      listarCategorias(uid),
      listarLancamentos(uid, 500),
    ]);
    return { contas, categorias, lancamentos };
  }, [uid]);

  if (carregando || !dados) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { contas, categorias, lancamentos } = dados;
  const ativas = contas.filter((c) => !c.archived);

  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const doMes = lancamentos.filter((l) => l.date >= inicioDoMes);

  const saldoTotal = ativas.reduce((s, c) => s + c.balance, 0);
  const receitas = doMes.filter((l) => l.type === "INCOME").reduce((s, l) => s + l.amount, 0);
  const despesas = doMes.filter((l) => l.type === "EXPENSE").reduce((s, l) => s + l.amount, 0);

  const porCategoria = new Map<string, CategorySlice>();
  for (const l of doMes) {
    if (l.type !== "EXPENSE") continue;
    const cat = categorias.find((c) => c.id === l.categoryId);
    const nome = cat?.name ?? "Sem categoria";
    const existente = porCategoria.get(nome);
    if (existente) existente.value += l.amount;
    else porCategoria.set(nome, { name: nome, value: l.amount, color: cat?.color ?? "#64748b" });
  }
  const fatias = [...porCategoria.values()].sort((a, b) => b.value - a.value);

  const nomeConta = (id: string) => contas.find((c) => c.id === id)?.name ?? "Conta";
  const nomeCategoria = (id: string | null) =>
    id ? categorias.find((c) => c.id === id)?.name : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {perfil?.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo das suas finanças.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo total" value={formatCurrency(saldoTotal)} icon={Wallet} />
        <StatCard label="Receitas do mês" value={formatCurrency(receitas)} icon={TrendingUp} tone="income" />
        <StatCard label="Despesas do mês" value={formatCurrency(despesas)} icon={TrendingDown} tone="expense" />
        <StatCard
          label="Resultado do mês"
          value={formatCurrency(receitas - despesas)}
          icon={Scale}
          tone={receitas - despesas >= 0 ? "income" : "expense"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={fatias} />
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
            {lancamentos.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma transação ainda
              </p>
            )}
            {lancamentos.slice(0, 6).map((l) => (
              <TransactionRow
                key={l.id}
                tx={{
                  id: l.id,
                  type: l.type,
                  amount: l.amount,
                  description: l.description,
                  date: l.date,
                  accountName: nomeConta(l.accountId),
                  categoryName: nomeCategoria(l.categoryId),
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
          {ativas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não tem contas cadastradas
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ativas.map((conta) => (
                <div key={conta.id} className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <span className="text-sm text-muted-foreground">{accountTypeLabel(conta.type)}</span>
                  <span className="text-sm font-medium">{conta.name}</span>
                  <span className="mt-1 text-lg font-semibold tabular-nums">
                    {formatCurrency(conta.balance, conta.currency)}
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
