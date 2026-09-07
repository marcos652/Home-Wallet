"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserStatusToggle } from "@/components/master/user-status-toggle";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { Falhou } from "@/components/dashboard/estado";
import { listarUsuarios, contasDoUsuario } from "@/lib/data";
import { formatCurrency, formatDate, initials } from "@/lib/format";

export default function MasterUsersPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  // Sem join no Firestore: as contas de cada usuário vêm em consultas separadas.
  const { dados: usuarios, carregando, erro, recarregar } = useAsync(async () => {
    if (!uid) return null;
    const lista = await listarUsuarios();
    return Promise.all(
      lista.map(async (u) => ({ ...u, accounts: await contasDoUsuario(u.id) })),
    );
  }, [uid]);

  if (erro) return <Falhou erro={erro} />;

  if (carregando || !usuarios) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gestão de todos os usuários da plataforma.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contas</TableHead>
              <TableHead>Saldo total</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => {
              const totalBalance = user.accounts.reduce((sum, a) => sum + a.balance, 0);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/master/users/${user.id}`} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {initials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium hover:underline">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                      {user.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{user.accounts.length}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatCurrency(totalBalance)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <UserStatusToggle userId={user.id} status={user.status} onMudou={recarregar} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
