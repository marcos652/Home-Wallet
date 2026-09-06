import { readFileSync } from "node:fs";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Reaproveita a instância entre hot-reloads do Next em desenvolvimento.
const globalForFirebase = globalThis as unknown as {
  firebaseApp: App | undefined;
  firestore: Firestore | undefined;
};

function credenciais() {
  const caminho = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!caminho) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH não definida no .env — aponte para o .json da conta de serviço do Firebase.",
    );
  }

  const conteudo = JSON.parse(readFileSync(caminho, "utf8"));
  if (conteudo.type !== "service_account" || !conteudo.private_key) {
    throw new Error(
      `${caminho} não é uma chave de conta de serviço. ` +
        "Baixe em Configurações do projeto → Contas de serviço → Gerar nova chave privada.",
    );
  }
  return conteudo;
}

function criarApp() {
  const existente = getApps()[0];
  if (existente) return existente;
  return initializeApp({ credential: cert(credenciais()) });
}

export function db(): Firestore {
  if (!globalForFirebase.firestore) {
    globalForFirebase.firebaseApp = criarApp();
    globalForFirebase.firestore = getFirestore(globalForFirebase.firebaseApp);
  }
  return globalForFirebase.firestore;
}

// Coleções. Onde o id do documento é o próprio valor único, o Firestore passa a
// garantir a unicidade que o Postgres dava com @unique.
export const col = {
  users: () => db().collection("users"),
  /** id = email, garante email único */
  usersByEmail: () => db().collection("usersByEmail"),
  accounts: () => db().collection("accounts"),
  categories: () => db().collection("categories"),
  /** transações carregam userId desnormalizado, já que não há join */
  transactions: () => db().collection("transactions"),
  /** id = Message-ID do email, garante que não reimporta */
  processedEmails: () => db().collection("processedEmails"),
  /** id = userId, uma integração por usuário */
  emailIntegrations: () => db().collection("emailIntegrations"),
};
