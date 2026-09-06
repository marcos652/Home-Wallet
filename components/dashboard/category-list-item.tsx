"use client";

import { DeleteConfirmButton } from "@/components/dashboard/delete-confirm-button";
import { deleteCategory } from "@/lib/actions/categories";

export function CategoryListItem({
  category,
}: {
  category: { id: string; name: string; color: string; isOwn: boolean };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <span className="flex items-center gap-2.5 text-sm font-medium">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        {category.name}
      </span>
      {category.isOwn && (
        <DeleteConfirmButton
          title="Excluir categoria"
          description="As transações associadas ficarão sem categoria."
          onConfirm={() => deleteCategory(category.id)}
        />
      )}
    </div>
  );
}
