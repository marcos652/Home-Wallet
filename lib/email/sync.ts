import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { parseNubankEmail } from "@/lib/email/parsers/nubank";
import { htmlToText } from "@/lib/email/html-to-text";

// The amount may be in either part depending on the notification, so read both.
export function emailBody(text: string | undefined, html: string | false | undefined) {
  return [text ?? "", html ? htmlToText(html) : ""].join(" ");
}

export type SyncResult = {
  imported: number;
  skipped: number;
  duplicates: number;
  scanned: number;
};

const NUBANK_SENDER = "nubank";
// On the very first run, look this far back instead of importing years of history.
const FIRST_RUN_LOOKBACK_DAYS = 7;

export async function syncEmailTransactions(userId: string): Promise<SyncResult> {
  const integration = await prisma.emailIntegration.findUnique({ where: { userId } });

  if (!integration || !integration.enabled) {
    throw new Error("Integração de email não está ativa.");
  }
  if (!integration.defaultAccountId) {
    throw new Error("Escolha a conta que vai receber os lançamentos importados.");
  }

  const account = await prisma.account.findUnique({
    where: { id: integration.defaultAccountId },
  });
  if (!account || account.userId !== userId) {
    throw new Error("A conta de destino não existe mais. Escolha outra.");
  }

  const since =
    integration.lastSyncAt ??
    new Date(Date.now() - FIRST_RUN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const client = new ImapFlow({
    host: integration.imapHost,
    port: integration.imapPort,
    secure: true,
    auth: { user: integration.imapUser, pass: decrypt(integration.imapPasswordEnc) },
    logger: false,
  });

  const result: SyncResult = { imported: 0, skipped: 0, duplicates: 0, scanned: 0 };

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      for await (const message of client.fetch(
        { from: NUBANK_SENDER, since },
        { envelope: true, source: true },
      )) {
        result.scanned += 1;

        const messageId = message.envelope?.messageId;
        if (!messageId || !message.source) {
          result.skipped += 1;
          continue;
        }

        const seen = await prisma.processedEmail.findUnique({ where: { messageId } });
        if (seen) {
          result.duplicates += 1;
          continue;
        }

        const mail = await simpleParser(message.source);
        const parsed = parseNubankEmail({
          subject: mail.subject ?? "",
          text: emailBody(mail.text, mail.html),
          date: mail.date ?? message.envelope?.date ?? new Date(),
        });

        if (!parsed) {
          // Recorded too, so marketing mail is not re-parsed on every run.
          await prisma.processedEmail.create({
            data: { messageId, userId, imported: false },
          });
          result.skipped += 1;
          continue;
        }

        const delta = parsed.type === "EXPENSE" ? -parsed.amount : parsed.amount;

        await prisma.$transaction([
          prisma.transaction.create({
            data: {
              accountId: account.id,
              type: parsed.type,
              amount: parsed.amount,
              description: parsed.description,
              date: parsed.date,
              source: "EMAIL",
              externalId: messageId,
            },
          }),
          prisma.account.update({
            where: { id: account.id },
            data: { balance: { increment: delta } },
          }),
          prisma.processedEmail.create({
            data: { messageId, userId, imported: true },
          }),
        ]);

        result.imported += 1;
      }
    } finally {
      lock.release();
    }

    await prisma.emailIntegration.update({
      where: { userId },
      data: { lastSyncAt: new Date(), lastSyncError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na sincronização";
    await prisma.emailIntegration.update({
      where: { userId },
      data: { lastSyncError: message },
    });
    throw new Error(message);
  } finally {
    await client.logout().catch(() => {});
  }

  return result;
}
