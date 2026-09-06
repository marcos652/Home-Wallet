"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMaster } from "@/lib/session";

export async function toggleUserStatus(userId: string) {
  await requireMaster();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "MASTER") {
    throw new Error("Usuário inválido");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });

  revalidatePath("/master/users");
  revalidatePath(`/master/users/${userId}`);
}
