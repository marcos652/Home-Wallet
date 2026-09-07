"use client";

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as fsLimit,
  runTransaction,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, COLECOES } from "@/lib/firebase-client";

export type Conta = {
  id: string;
  userId: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT" | "CASH";
  balance: number;
  currency: string;
  archived: boolean;
  createdAt: Date;
};

export type Categoria = {
  id: string;
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
};

export type Lancamento = {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date;
  source: "MANUAL" | "EMAIL";
  externalId: string | null;
};

export type Usuario = {
  id: string;
  name: string;
  email: string;
  role: "MASTER" | "USER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

export type Integracao = {
  userId: string;
  enabled: boolean;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPasswordEnc: string;
  defaultAccountId: string | null;
  lastSyncAt: Date | null;
  lastSyncError: string | null;
};

function data(valor: unknown): Date {
  return valor instanceof Timestamp ? valor.toDate() : new Date(valor as string);
}

const delta = (tipo: "INCOME" | "EXPENSE", valor: number) =>
  tipo === "EXPENSE" ? -valor : valor;

/* ---------- contas ---------- */

export async function listarContas(userId: string): Promise<Conta[]> {
  const snap = await getDocs(
    query(collection(db(), COLECOES.accounts), where("userId", "==", userId)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: data(d.data().createdAt) }) as Conta)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function buscarConta(id: string): Promise<Conta | null> {
  const snap = await getDoc(doc(db(), COLECOES.accounts, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: data(snap.data().createdAt) } as Conta;
}

export async function criarConta(
  userId: string,
  dados: { name: string; type: Conta["type"]; balance: number },
) {
  await addDoc(collection(db(), COLECOES.accounts), {
    userId,
    ...dados,
    currency: "BRL",
    archived: false,
    createdAt: Timestamp.now(),
  });
}

export async function atualizarConta(
  id: string,
  dados: { name: string; type: Conta["type"]; balance: number },
) {
  await updateDoc(doc(db(), COLECOES.accounts, id), dados);
}

export async function alternarArquivada(id: string, arquivada: boolean) {
  await updateDoc(doc(db(), COLECOES.accounts, id), { archived: !arquivada });
}

// Sem cascade no Firestore: os lançamentos da conta são apagados explicitamente.
export async function excluirConta(id: string) {
  const snap = await getDocs(
    query(collection(db(), COLECOES.transactions), where("accountId", "==", id)),
  );
  const lote = writeBatch(db());
  snap.docs.forEach((d) => lote.delete(d.ref));
  lote.delete(doc(db(), COLECOES.accounts, id));
  await lote.commit();
}

/* ---------- categorias ---------- */

export async function listarCategorias(userId: string): Promise<Categoria[]> {
  const snap = await getDocs(
    query(collection(db(), COLECOES.categories), where("userId", "==", userId)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Categoria)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function criarCategoria(
  userId: string,
  dados: { name: string; type: Categoria["type"]; color: string },
) {
  await addDoc(collection(db(), COLECOES.categories), {
    userId,
    ...dados,
    icon: "circle",
  });
}

export async function excluirCategoria(id: string) {
  await deleteDoc(doc(db(), COLECOES.categories, id));
}

/* ---------- lançamentos ---------- */

function paraLancamento(d: { id: string; data: () => Record<string, unknown> }): Lancamento {
  const v = d.data();
  return { id: d.id, ...v, date: data(v.date) } as Lancamento;
}

// Ordenar no Firestore junto com o filtro exigiria um índice composto criado à
// mão no console. Como o volume por usuário é pequeno, ordenamos aqui.
export async function listarLancamentos(userId: string, max = 200): Promise<Lancamento[]> {
  const snap = await getDocs(
    query(collection(db(), COLECOES.transactions), where("userId", "==", userId), fsLimit(max)),
  );
  return snap.docs
    .map(paraLancamento)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function listarLancamentosDaConta(accountId: string): Promise<Lancamento[]> {
  const snap = await getDocs(
    query(collection(db(), COLECOES.transactions), where("accountId", "==", accountId)),
  );
  return snap.docs.map(paraLancamento).sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Lançamento e saldo mudam juntos ou não mudam — daí a transação do Firestore.
export async function criarLancamento(
  userId: string,
  dados: {
    accountId: string;
    categoryId: string | null;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date: Date;
  },
) {
  await runTransaction(db(), async (tx) => {
    const contaRef = doc(db(), COLECOES.accounts, dados.accountId);
    const conta = await tx.get(contaRef);
    if (!conta.exists()) throw new Error("Conta não encontrada");

    tx.set(doc(collection(db(), COLECOES.transactions)), {
      userId,
      ...dados,
      date: Timestamp.fromDate(dados.date),
      source: "MANUAL",
      externalId: null,
      createdAt: Timestamp.now(),
    });
    tx.update(contaRef, {
      balance: conta.data().balance + delta(dados.type, dados.amount),
    });
  });
}

export async function atualizarLancamento(
  id: string,
  anterior: Lancamento,
  dados: {
    accountId: string;
    categoryId: string | null;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date: Date;
  },
) {
  await runTransaction(db(), async (tx) => {
    const desfaz = -delta(anterior.type, anterior.amount);
    const aplica = delta(dados.type, dados.amount);

    if (anterior.accountId === dados.accountId) {
      const ref = doc(db(), COLECOES.accounts, dados.accountId);
      const conta = await tx.get(ref);
      if (!conta.exists()) throw new Error("Conta não encontrada");
      tx.update(ref, { balance: conta.data().balance + desfaz + aplica });
    } else {
      const refAntiga = doc(db(), COLECOES.accounts, anterior.accountId);
      const refNova = doc(db(), COLECOES.accounts, dados.accountId);
      const [antiga, nova] = [await tx.get(refAntiga), await tx.get(refNova)];
      if (!antiga.exists() || !nova.exists()) throw new Error("Conta não encontrada");
      tx.update(refAntiga, { balance: antiga.data().balance + desfaz });
      tx.update(refNova, { balance: nova.data().balance + aplica });
    }

    tx.update(doc(db(), COLECOES.transactions, id), {
      ...dados,
      date: Timestamp.fromDate(dados.date),
    });
  });
}

export async function excluirLancamento(lancamento: Lancamento) {
  await runTransaction(db(), async (tx) => {
    const ref = doc(db(), COLECOES.accounts, lancamento.accountId);
    const conta = await tx.get(ref);
    if (conta.exists()) {
      tx.update(ref, {
        balance: conta.data().balance - delta(lancamento.type, lancamento.amount),
      });
    }
    tx.delete(doc(db(), COLECOES.transactions, lancamento.id));
  });
}

/* ---------- usuários (área master) ---------- */

export async function listarUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db(), COLECOES.users));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: data(d.data().createdAt) }) as Usuario)
    .filter((u) => u.role === "USER")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function buscarUsuario(id: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db(), COLECOES.users, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: data(snap.data().createdAt) } as Usuario;
}

export async function alternarStatusUsuario(id: string, status: Usuario["status"]) {
  await updateDoc(doc(db(), COLECOES.users, id), {
    status: status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
  });
}

export async function atualizarNome(id: string, name: string) {
  await updateDoc(doc(db(), COLECOES.users, id), { name });
}

/** Contas e lançamentos de qualquer usuário — o master lê, as regras permitem. */
export async function contasDoUsuario(userId: string) {
  return listarContas(userId);
}

export async function lancamentosDoUsuario(userId: string, max = 10) {
  return listarLancamentos(userId, max);
}

/* ---------- integração de email ---------- */

export async function buscarIntegracao(userId: string): Promise<Integracao | null> {
  const snap = await getDoc(doc(db(), COLECOES.emailIntegrations, userId));
  if (!snap.exists()) return null;
  const v = snap.data();
  return {
    ...v,
    userId,
    lastSyncAt: v.lastSyncAt ? data(v.lastSyncAt) : null,
  } as Integracao;
}

export async function salvarIntegracao(
  userId: string,
  dados: {
    enabled: boolean;
    imapUser: string;
    imapPasswordEnc: string;
    defaultAccountId: string;
  },
) {
  await setDoc(
    doc(db(), COLECOES.emailIntegrations, userId),
    {
      userId,
      imapHost: "imap.gmail.com",
      imapPort: 993,
      ...dados,
      lastSyncError: null,
    },
    { merge: true },
  );
}
