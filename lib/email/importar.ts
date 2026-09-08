"use client";

import { doc, getDoc, setDoc, collection, runTransaction, Timestamp } from "firebase/firestore";
import { db, COLECOES } from "@/lib/firebase-client";
import { buscarIntegracao } from "@/lib/data";

export type ResultadoImportacao = {
  lidos: number;
  importados: number;
  repetidos: number;
};

type EmailLido = {
  messageId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
};

// O Message-ID vira o id do documento, e "/" não é aceito em id.
const idDoEmail = (messageId: string) => messageId.replace(/\//g, "_");

export async function importarDoEmail(userId: string): Promise<ResultadoImportacao> {
  const integracao = await buscarIntegracao(userId);
  if (!integracao) throw new Error("Configure a importação por email primeiro.");
  if (!integracao.enabled) throw new Error("A importação por email está desativada.");
  if (!integracao.defaultAccountId) throw new Error("Escolha a conta que recebe os lançamentos.");

  const contaRef = doc(db(), COLECOES.accounts, integracao.defaultAccountId);
  if (!(await getDoc(contaRef)).exists()) {
    throw new Error("A conta de destino não existe mais. Escolha outra.");
  }

  const resposta = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imapUser: integracao.imapUser,
      imapPassword: integracao.imapPasswordEnc,
      since: integracao.lastSyncAt?.toISOString(),
    }),
  });

  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.error ?? "Falha ao ler o email");

  const encontrados: EmailLido[] = dados.encontrados ?? [];
  const resultado: ResultadoImportacao = { lidos: dados.lidos ?? 0, importados: 0, repetidos: 0 };

  for (const email of encontrados) {
    const vistoRef = doc(db(), COLECOES.processedEmails, idDoEmail(email.messageId));
    if ((await getDoc(vistoRef)).exists()) {
      resultado.repetidos += 1;
      continue;
    }

    const delta = email.type === "EXPENSE" ? -email.amount : email.amount;

    // Lançamento, saldo e marca de "já visto" entram juntos ou nada entra.
    await runTransaction(db(), async (tx) => {
      const conta = await tx.get(contaRef);
      if (!conta.exists()) throw new Error("Conta de destino sumiu durante a importação");

      tx.set(doc(collection(db(), COLECOES.transactions)), {
        userId,
        accountId: integracao.defaultAccountId,
        categoryId: null,
        type: email.type,
        amount: email.amount,
        description: email.description,
        date: Timestamp.fromDate(new Date(email.date)),
        source: "EMAIL",
        externalId: email.messageId,
        createdAt: Timestamp.now(),
      });
      tx.update(contaRef, { balance: conta.data().balance + delta });
      tx.set(vistoRef, { userId, imported: true, processedAt: Timestamp.now() });
    });

    resultado.importados += 1;
  }

  await setDoc(
    doc(db(), COLECOES.emailIntegrations, userId),
    { lastSyncAt: Timestamp.now(), lastSyncError: null },
    { merge: true },
  );

  return resultado;
}
