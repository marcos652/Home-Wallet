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
import { createAccount, updateAccount } from "@/lib/actions/accounts";

import { accountTypeLabel } from "@/lib/format";

const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH"] as const;

type AccountFormValues = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export function AccountFormDialog({ account }: { account?: AccountFormValues }) {
  const isEditing = !!account;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = isEditing ? updateAccount.bind(null, account.id) : createAccount;
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
      toast.success(isEditing ? "Conta atualizada" : "Conta criada");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEditing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Pencil className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Editar conta</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" strokeWidth={1.75} />
          Nova conta
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da conta." : "Cadastre uma nova conta ou carteira."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={account?.name} placeholder="Ex: Conta corrente" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={account?.type ?? "CHECKING"}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {accountTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="balance">{isEditing ? "Saldo atual" : "Saldo inicial"}</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              step="0.01"
              defaultValue={account?.balance ?? 0}
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
