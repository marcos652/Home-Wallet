"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { encrypt } from "@/lib/crypto";
import { syncEmailTransactions } from "@/lib/email/sync";
import type { ActionState } from "@/lib/actions/types";

const settingsSchema = z.object({
  enabled: z.boolean(),
  imapUser: z.string().trim().email("Informe o endereço Gmail que recebe os avisos"),
  // Google shows the app password as "abcd efgh ijkl mnop"; accept it pasted as-is.
  imapPassword: z.string().transform((value) => value.replace(/\s+/g, "")),
  defaultAccountId: z.string().min(1, "Escolha a conta de destino"),
});

export async function saveEmailIntegration(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = settingsSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    imapUser: formData.get("imapUser"),
    imapPassword: formData.get("imapPassword"),
    defaultAccountId: formData.get("defaultAccountId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { enabled, imapUser, imapPassword, defaultAccountId } = parsed.data;

  const account = await prisma.account.findUnique({ where: { id: defaultAccountId } });
  if (!account || account.userId !== user.id) {
    return { error: "Conta de destino inválida" };
  }

  const existing = await prisma.emailIntegration.findUnique({ where: { userId: user.id } });

  // An empty password field means "keep the one already saved".
  if (!imapPassword && !existing) {
    return { error: "Informe a senha de app do Gmail" };
  }
  const imapPasswordEnc = imapPassword ? encrypt(imapPassword) : existing!.imapPasswordEnc;

  await prisma.emailIntegration.upsert({
    where: { userId: user.id },
    create: { userId: user.id, enabled, imapUser, imapPasswordEnc, defaultAccountId },
    update: { enabled, imapUser, imapPasswordEnc, defaultAccountId, lastSyncError: null },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export type SyncActionState = ActionState & { summary?: string };

export async function runEmailSync(): Promise<SyncActionState> {
  const user = await requireUser();

  try {
    const result = await syncEmailTransactions(user.id);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");

    return {
      success: true,
      summary:
        result.imported > 0
          ? `${result.imported} transação(ões) importada(s) de ${result.scanned} email(s).`
          : `Nenhuma transação nova (${result.scanned} email(s) verificado(s)).`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha na sincronização" };
  }
}
