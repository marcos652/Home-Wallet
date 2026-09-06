import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  runTransaction,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { decrypt } from "@/lib/crypto";
import { parseNubankEmail } from "@/lib/email/parsers/nubank";
import { htmlToText } from "@/lib/email/html-to-text";

export type SyncResult = {
  imported: number;
  skipped: number;
  duplicates: number;
  scanned: number;
};

const REMETENTE = "nubank";
const DIAS_NA_PRIMEIRA_VEZ = 7;

export function emailBody(text: string | undefined, html: string | false | undefined) {
  return [text ?? "", html ? htmlToText(html) : ""].join(" ");
}

// Migrações antigas guardavam a senha criptografada; o app novo grava em texto,
// protegida pelas regras do Firestore. Aceita as duas formas.
function senhaDoImap(guardada: string) {
  if (!guardada.includes(":")) return guardada;
  try {
    return decrypt(guardada);
  } catch {
    return guardada;
  }
}

export async function syncEmailTransactions(
  db: Firestore,
  userId: string,
): Promise<SyncResult> {
  const integSnap = await getDoc(doc(db, "emailIntegrations", userId));
  if (!integSnap.exists()) throw new Error("Integração de email não configurada.");

  const integ = integSnap.data();
  if (!integ.enabled) throw new Error("Integração de email não está ativa.");
  if (!integ.defaultAccountId) {
    throw new Error("Escolha a conta que vai receber os lançamentos importados.");
  }

  const contaRef = doc(db, "accounts", integ.defaultAccountId as string);
  if (!(await getDoc(contaRef)).exists()) {
    throw new Error("A conta de destino não existe mais. Escolha outra.");
  }

  const desde: Date = integ.lastSyncAt
    ? (integ.lastSyncAt as Timestamp).toDate()
    : new Date(Date.now() - DIAS_NA_PRIMEIRA_VEZ * 24 * 60 * 60 * 1000);

  const client = new ImapFlow({
    host: (integ.imapHost as string) ?? "imap.gmail.com",
    port: (integ.imapPort as number) ?? 993,
    secure: true,
    auth: {
      user: integ.imapUser as string,
      pass: senhaDoImap(integ.imapPasswordEnc as string),
    },
    logger: false,
  });

  const resultado: SyncResult = { imported: 0, skipped: 0, duplicates: 0, scanned: 0 };

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      for await (const message of client.fetch(
        { from: REMETENTE, since: desde },
        { envelope: true, source: true },
      )) {
        resultado.scanned += 1;

        const messageId = message.envelope?.messageId;
        if (!messageId || !message.source) {
          resultado.skipped += 1;
          continue;
        }

        // O id do documento é o Message-ID: mesmo que o lançamento seja
        // excluído depois, o email não é reimportado.
        const vistoRef = doc(db, "processedEmails", messageId.replace(/\//g, "_"));
        if ((await getDoc(vistoRef)).exists()) {
          resultado.duplicates += 1;
          continue;
        }

        const mail = await simpleParser(message.source);
        const lido = parseNubankEmail({
          subject: mail.subject ?? "",
          text: emailBody(mail.text, mail.html),
          date: mail.date ?? message.envelope?.date ?? new Date(),
        });

        if (!lido) {
          await setDoc(vistoRef, { userId, imported: false, processedAt: Timestamp.now() });
          resultado.skipped += 1;
          continue;
        }

        const delta = lido.type === "EXPENSE" ? -lido.amount : lido.amount;

        await runTransaction(db, async (tx) => {
          const conta = await tx.get(contaRef);
          if (!conta.exists()) throw new Error("Conta de destino sumiu durante a importação");

          tx.set(doc(collection(db, "transactions")), {
            userId,
            accountId: integ.defaultAccountId,
            categoryId: null,
            type: lido.type,
            amount: lido.amount,
            description: lido.description,
            date: Timestamp.fromDate(lido.date),
            source: "EMAIL",
            externalId: messageId,
            createdAt: Timestamp.now(),
          });
          tx.update(contaRef, { balance: conta.data().balance + delta });
          tx.set(vistoRef, { userId, imported: true, processedAt: Timestamp.now() });
        });

        resultado.imported += 1;
      }
    } finally {
      lock.release();
    }

    await updateDoc(integSnap.ref, { lastSyncAt: Timestamp.now(), lastSyncError: null });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha na sincronização";
    await updateDoc(integSnap.ref, { lastSyncError: mensagem }).catch(() => {});
    throw new Error(mensagem);
  } finally {
    await client.logout().catch(() => {});
  }

  return resultado;
}
