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
import { criarConta, atualizarConta, type Conta } from "@/lib/data";
import { useFirebase } from "@/components/auth/firebase-provider";
import { accountTypeLabel } from "@/lib/format";

const TIPOS = ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH"] as const;

export function AccountFormDialog({
  account,
  onSalvo,
}: {
  account?: Conta;
  onSalvo: () => void;
}) {
  const editando = !!account;
  const { perfil } = useFirebase();
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string>();
  const [tipo, setTipo] = useState<Conta["type"]>(account?.type ?? "CHECKING");
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    if (!perfil) return;
    const name = String(formData.get("name") ?? "").trim();
    const balance = Number(formData.get("balance"));

    if (!name) return setErro("Informe um nome para a conta");
    if (!Number.isFinite(balance)) return setErro("Informe um saldo válido");

    iniciar(async () => {
      try {
        if (editando) await atualizarConta(account.id, { name, type: tipo, balance });
        else await criarConta(perfil.uid, { name, type: tipo, balance });
        setErro(undefined);
        setOpen(false);
        toast.success(editando ? "Conta atualizada" : "Conta criada");
        onSalvo();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {editando ? (
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
          <DialogTitle>{editando ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {editando ? "Atualize os dados da conta." : "Cadastre uma nova conta ou carteira."}
          </DialogDescription>
        </DialogHeader>
        <form action={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={account?.name} placeholder="Ex: Conta corrente" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo((typeof v === "string" ? v : "CHECKING") as Conta["type"])}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {accountTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="balance">{editando ? "Saldo atual" : "Saldo inicial"}</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              step="0.01"
              defaultValue={account?.balance ?? 0}
              required
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={pendente}>
              {pendente && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
