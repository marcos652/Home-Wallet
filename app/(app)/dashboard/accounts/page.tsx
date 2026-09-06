import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { AccountFormDialog } from "@/components/dashboard/account-form-dialog";
import { AccountCard } from "@/components/dashboard/account-card";

export default async function AccountsPage() {
  const user = await requireUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas e carteiras.</p>
        </div>
        <AccountFormDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Você ainda não tem contas cadastradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
