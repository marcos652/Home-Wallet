import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserStatusToggle } from "@/components/master/user-status-toggle";

export default async function MasterUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    include: { accounts: true },
    orderBy: { createdAt: "desc" },
  });

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
            {users.map((user) => {
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
                    <UserStatusToggle userId={user.id} status={user.status} />
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
