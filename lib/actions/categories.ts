"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { categorySchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/types";

export async function createCategory(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon") || "circle",
    color: formData.get("color") || "#6366f1",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.category.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath("/dashboard/categories");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const user = await requireUser();
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== user.id) {
    throw new Error("Categoria não encontrada");
  }

  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/dashboard/categories");
}
