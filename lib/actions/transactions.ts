"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { transactionSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/types";

function signedDelta(type: "INCOME" | "EXPENSE" | "TRANSFER", amount: number) {
  return type === "EXPENSE" ? -amount : amount;
}

async function assertOwnedAccount(userId: string, accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== userId) {
    throw new Error("Conta inválida");
  }
  return account;
}

export async function createTransaction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = transactionSchema.safeParse({
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || null,
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { accountId, categoryId, type, amount, description, date } = parsed.data;

  try {
    await assertOwnedAccount(user.id, accountId);
  } catch {
    return { error: "Conta inválida" };
  }

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId,
        categoryId: categoryId || null,
        type,
        amount,
        description,
        date,
      },
    }),
    prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: signedDelta(type, amount) } },
    }),
  ]);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransaction(
  transactionId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true },
  });
  if (!existing || existing.account.userId !== user.id) {
    return { error: "Transação não encontrada" };
  }

  const parsed = transactionSchema.safeParse({
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || null,
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { accountId, categoryId, type, amount, description, date } = parsed.data;

  try {
    await assertOwnedAccount(user.id, accountId);
  } catch {
    return { error: "Conta inválida" };
  }

  const revertOld = -signedDelta(existing.type, existing.amount);
  const applyNew = signedDelta(type, amount);

  const balanceUpdates =
    accountId === existing.accountId
      ? [
          prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: revertOld + applyNew } },
          }),
        ]
      : [
          prisma.account.update({
            where: { id: existing.accountId },
            data: { balance: { increment: revertOld } },
          }),
          prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: applyNew } },
          }),
        ];

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { accountId, categoryId: categoryId || null, type, amount, description, date },
    }),
    ...balanceUpdates,
  ]);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const user = await requireUser();

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true },
  });
  if (!existing || existing.account.userId !== user.id) {
    throw new Error("Transação não encontrada");
  }

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id: transactionId } }),
    prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: -signedDelta(existing.type, existing.amount) } },
    }),
  ]);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}
