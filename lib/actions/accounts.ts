"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { accountSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/types";

export async function createAccount(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.account.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAccount(
  accountId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return { error: "Conta não encontrada" };
  }

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.account.update({
    where: { id: accountId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleArchiveAccount(accountId: string) {
  const user = await requireUser();
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    throw new Error("Conta não encontrada");
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { archived: !account.archived },
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(accountId: string) {
  const user = await requireUser();
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    throw new Error("Conta não encontrada");
  }

  await prisma.account.delete({ where: { id: accountId } });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}
