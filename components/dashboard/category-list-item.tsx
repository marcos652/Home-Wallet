"use client";

import { DeleteConfirmButton } from "@/components/dashboard/delete-confirm-button";
import { excluirCategoria, type Categoria } from "@/lib/data";

export function CategoryListItem({
  categoria,
  onMudou,
}: {
  categoria: Categoria;
  onMudou: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <span className="flex items-center gap-2.5 text-sm font-medium">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoria.color }} />
        {categoria.name}
      </span>
      <DeleteConfirmButton
        title="Excluir categoria"
        description="As transações associadas ficarão sem categoria."
        onConfirm={async () => {
          await excluirCategoria(categoria.id);
          onMudou();
        }}
      />
    </div>
  );
}
