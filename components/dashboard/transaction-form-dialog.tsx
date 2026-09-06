"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";

function toDateInputValue(date?: Date | string) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 10);
}

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; type: "INCOME" | "EXPENSE" };

type TransactionFormValues = {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date | string;
};

export function TransactionFormDialog({
  accounts,
  categories,
  transaction,
  defaultAccountId,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  transaction?: TransactionFormValues;
  defaultAccountId?: string;
}) {
  const isEditing = !!transaction;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction?.type ?? "EXPENSE");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = isEditing ? updateTransaction.bind(null, transaction.id) : createTransaction;
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
      toast.success(isEditing ? "Transação atualizada" : "Transação criada");
    });
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEditing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Pencil className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Editar transação</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" strokeWidth={1.75} />
          Nova transação
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do lançamento." : "Registre uma nova movimentação."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "default" : "outline"}
              onClick={() => setType("EXPENSE")}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "outline"}
              onClick={() => setType("INCOME")}
            >
              Receita
            </Button>
          </div>
          <input type="hidden" name="type" value={type} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountId">Conta</Label>
            <Select name="accountId" defaultValue={transaction?.accountId ?? defaultAccountId}>
              <SelectTrigger id="accountId" className="w-full">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select name="categoryId" defaultValue={transaction?.categoryId ?? undefined}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={transaction?.amount}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={toDateInputValue(transaction?.date)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              defaultValue={transaction?.description}
              placeholder="Ex: Supermercado"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
