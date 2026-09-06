"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Layers, Receipt, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { UserStatusToggle } from "@/components/master/user-status-toggle";
import { useAsync } from "@/lib/use-async";
import {
  buscarUsuario,
  contasDoUsuario,
  lancamentosDoUsuario,
  listarCategorias,
} from "@/lib/data";
import { formatCurrency, formatDate, accountTypeLabel, initials } from "@/lib/format";

export default function MasterUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { dados, carregando, recarregar } = useAsync(async () => {
    const usuario = await buscarUsuario(id);
    if (!usuario || usuario.role !== "USER") return null;
    const [contas, lancamentos, categorias] = await Promise.all([
      contasDoUsuario(id),
      lancamentosDoUsuario(id, 500),
      listarCategorias(id),
    ]);
    return { usuario, contas, lancamentos, categorias };
  }, [id]);

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Usuário não encontrado.</p>
        <Link href="/master/users" className="text-sm text-primary hover:underline">
          Voltar para usuários
        </Link>
      </div>
    );
  }

  const { usuario, contas, lancamentos, categorias } = dados;
  const totalBalance = contas.reduce((sum, a) => sum + a.balance, 0);
  const recentes = lancamentos.slice(0, 10);
  const nomeConta = (contaId: string) => contas.find((c) => c.id === contaId)?.name ?? "Conta";
  const categoria = (categoryId: string | null) =>
    categoryId ? categorias.find((c) => c.id === categoryId) : undefined;

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
              {initials(usuario.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{usuario.name}</h1>
              <Badge variant={usuario.status === "ACTIVE" ? "secondary" : "outline"}>
                {usuario.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {usuario.email} · desde {formatDate(usuario.createdAt)}
            </p>
          </div>
        </div>
        <UserStatusToggle userId={usuario.id} status={usuario.status} onMudou={recarregar} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Saldo total" value={formatCurrency(totalBalance)} icon={Wallet} />
        <StatCard label="Contas" value={String(contas.length)} icon={Layers} />
        <StatCard label="Transações" value={String(lancamentos.length)} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contas.map((account) => (
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
          {recentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma transação registrada</p>
          ) : (
            recentes.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={{
                  id: tx.id,
                  type: tx.type,
                  amount: tx.amount,
                  description: tx.description,
                  date: tx.date,
                  accountName: nomeConta(tx.accountId),
                  categoryName: categoria(tx.categoryId)?.name,
                  categoryColor: categoria(tx.categoryId)?.color,
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
