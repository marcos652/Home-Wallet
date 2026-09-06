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
import { createCategory } from "@/lib/actions/categories";

const PALETTE = ["#6366f1", "#22c55e", "#ef4444", "#f97316", "#3b82f6", "#ec4899", "#a855f7", "#64748b"];

export function CategoryFormDialog({ type }: { type: "INCOME" | "EXPENSE" }) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
      toast.success("Categoria criada");
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
          <DialogTitle>{type === "INCOME" ? "Nova categoria de receita" : "Nova categoria de despesa"}</DialogTitle>
          <DialogDescription>Organize suas transações por categoria.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Ex: Educação" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((paletteColor) => (
                <button
                  key={paletteColor}
                  type="button"
                  onClick={() => setColor(paletteColor)}
                  className="size-7 rounded-full ring-offset-2 ring-offset-background transition-all"
                  style={{
                    backgroundColor: paletteColor,
                    boxShadow: color === paletteColor ? `0 0 0 2px ${paletteColor}` : undefined,
                  }}
                >
                  <span className="sr-only">{paletteColor}</span>
                </button>
              ))}
            </div>
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
