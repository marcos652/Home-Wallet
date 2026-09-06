"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/actions/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
});

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  // Layout-level so the name in the sidebar/topbar refreshes too, not just the form.
  revalidatePath("/", "layout");
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
  });

export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const matches = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!matches) {
    return { error: "Senha atual incorreta" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}
