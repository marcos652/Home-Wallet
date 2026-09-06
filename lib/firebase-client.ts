import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Configuração pública do app web. Não é segredo: quem protege os dados são as
// regras de segurança do Firestore somadas ao usuário autenticado.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function auth(): Auth {
  return getAuth(app());
}

export function db(): Firestore {
  return getFirestore(app());
}

export const COLECOES = {
  users: "users",
  accounts: "accounts",
  categories: "categories",
  transactions: "transactions",
  emailIntegrations: "emailIntegrations",
  processedEmails: "processedEmails",
} as const;
