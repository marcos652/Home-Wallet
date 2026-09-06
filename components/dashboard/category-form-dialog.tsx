"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { criarCategoria } from "@/lib/data";
import { useFirebase } from "@/components/auth/firebase-provider";

const PALETA = ["#6366f1", "#22c55e", "#ef4444", "#f97316", "#3b82f6", "#ec4899", "#a855f7", "#64748b"];

export function CategoryFormDialog({
  type,
  onSalvo,
}: {
  type: "INCOME" | "EXPENSE";
  onSalvo: () => void;
}) {
  const { perfil } = useFirebase();
  const [open, setOpen] = useState(false);
  const [cor, setCor] = useState(PALETA[0]);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    if (!perfil) return;
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return setErro("Informe um nome para a categoria");

    iniciar(async () => {
      try {
        await criarCategoria(perfil.uid, { name, type, color: cor });
        setErro(undefined);
        setOpen(false);
        toast.success("Categoria criada");
        onSalvo();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-4" strokeWidth={1.75} />
        {type === "INCOME" ? "Nova receita" : "Nova despesa"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {type === "INCOME" ? "Nova categoria de receita" : "Nova categoria de despesa"}
          </DialogTitle>
          <DialogDescription>Organize suas transações por categoria.</DialogDescription>
        </DialogHeader>
        <form action={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Ex: Educação" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETA.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="size-7 rounded-full ring-offset-2 ring-offset-background transition-all"
                  style={{ backgroundColor: c, boxShadow: cor === c ? `0 0 0 2px ${c}` : undefined }}
                >
                  <span className="sr-only">{c}</span>
                </button>
              ))}
            </div>
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
