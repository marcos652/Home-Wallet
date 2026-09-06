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
import {
  criarLancamento,
  atualizarLancamento,
  type Conta,
  type Categoria,
  type Lancamento,
} from "@/lib/data";
import { useFirebase } from "@/components/auth/firebase-provider";

function paraInput(d?: Date) {
  return (d ?? new Date()).toISOString().slice(0, 10);
}

export function TransactionFormDialog({
  contas,
  categorias,
  lancamento,
  contaPadrao,
  onSalvo,
}: {
  contas: Conta[];
  categorias: Categoria[];
  lancamento?: Lancamento;
  contaPadrao?: string;
  onSalvo: () => void;
}) {
  const editando = !!lancamento;
  const { perfil } = useFirebase();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"INCOME" | "EXPENSE">(lancamento?.type ?? "EXPENSE");
  const [contaId, setContaId] = useState(lancamento?.accountId ?? contaPadrao ?? "");
  const [categoriaId, setCategoriaId] = useState(lancamento?.categoryId ?? "");
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  const categoriasDoTipo = categorias.filter((c) => c.type === tipo);

  function salvar(formData: FormData) {
    if (!perfil) return;
    const amount = Number(formData.get("amount"));
    const description = String(formData.get("description") ?? "").trim();
    const date = new Date(`${formData.get("date")}T12:00:00`);

    if (!contaId) return setErro("Selecione uma conta");
    if (!(amount > 0)) return setErro("Informe um valor maior que zero");
    if (!description) return setErro("Informe uma descrição");

    const dados = {
      accountId: contaId,
      categoryId: categoriaId || null,
      type: tipo,
      amount,
      description,
      date,
    };

    iniciar(async () => {
      try {
        if (editando) await atualizarLancamento(lancamento.id, lancamento, dados);
        else await criarLancamento(perfil.uid, dados);
        setErro(undefined);
        setOpen(false);
        toast.success(editando ? "Transação atualizada" : "Transação criada");
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
          <DialogTitle>{editando ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {editando ? "Atualize os dados do lançamento." : "Registre uma nova movimentação."}
          </DialogDescription>
        </DialogHeader>
        <form action={salvar} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === "EXPENSE" ? "default" : "outline"}
              onClick={() => setTipo("EXPENSE")}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={tipo === "INCOME" ? "default" : "outline"}
              onClick={() => setTipo("INCOME")}
            >
              Receita
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountId">Conta</Label>
            <Select
              value={contaId}
              onValueChange={(v) => setContaId(typeof v === "string" ? v : "")}
            >
              <SelectTrigger id="accountId" className="w-full">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => setCategoriaId(typeof v === "string" ? v : "")}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
                defaultValue={lancamento?.amount}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={paraInput(lancamento?.date)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              defaultValue={lancamento?.description}
              placeholder="Ex: Supermercado"
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
