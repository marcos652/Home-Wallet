import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { syncEmailTransactions } from "../lib/email/sync";

// Roda fora do navegador, então entra no Firebase como o próprio usuário —
// as mesmas regras de segurança valem aqui.
async function main() {
  const email = process.env.SYNC_USER_EMAIL;
  const senha = process.env.SYNC_USER_PASSWORD;
  if (!email || !senha) {
    throw new Error("Defina SYNC_USER_EMAIL e SYNC_USER_PASSWORD no .env");
  }

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  const cred = await signInWithEmailAndPassword(getAuth(app), email, senha);
  const r = await syncEmailTransactions(getFirestore(app), cred.user.uid);

  console.log(
    `[${email}] ${r.imported} importada(s), ${r.duplicates} duplicada(s), ` +
      `${r.skipped} ignorada(s), ${r.scanned} email(s) lido(s).`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
