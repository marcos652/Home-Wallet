"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, COLECOES } from "@/lib/firebase-client";

export type Perfil = {
  uid: string;
  name: string;
  email: string;
  role: "MASTER" | "USER";
  status: "ACTIVE" | "INACTIVE";
};

type Estado = {
  usuario: User | null;
  perfil: Perfil | null;
  carregando: boolean;
  erro?: string;
  sair: () => Promise<void>;
};

const Ctx = createContext<Estado>({
  usuario: null,
  perfil: null,
  carregando: true,
  sair: async () => {},
});

// Se o Firebase não responder nesse tempo, algo está errado na configuração —
// tipicamente o domínio não autorizado, que faz o SDK nunca responder.
const LIMITE_DE_ESPERA_MS = 10_000;

function explicar(erro: unknown) {
  const codigo = (erro as { code?: string })?.code ?? "";
  if (codigo === "auth/unauthorized-domain") {
    return `Este endereço (${typeof window !== "undefined" ? window.location.hostname : ""}) não está liberado no Firebase. Adicione-o em Authentication → Settings → Domínios autorizados.`;
  }
  if (codigo === "auth/network-request-failed") {
    return "Sem conexão com o Firebase. Verifique sua internet.";
  }
  if (codigo === "permission-denied") {
    return "As regras do Firestore recusaram a leitura do seu cadastro.";
  }
  return erro instanceof Error ? erro.message : "Falha ao conectar no Firebase.";
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    const relogio = setTimeout(() => {
      setCarregando((aindaCarregando) => {
        if (aindaCarregando) {
          setErro(
            `O Firebase não respondeu. O motivo mais comum é o endereço ${window.location.hostname} não estar liberado em Authentication → Settings → Domínios autorizados.`,
          );
        }
        return false;
      });
    }, LIMITE_DE_ESPERA_MS);

    const cancelar = onAuthStateChanged(
      auth(),
      async (u) => {
        clearTimeout(relogio);
        setUsuario(u);

        if (!u) {
          setPerfil(null);
          setCarregando(false);
          return;
        }

        try {
          // O cadastro (nome, papel, situação) mora no Firestore; o Auth só
          // guarda a credencial.
          const snap = await getDoc(doc(db(), COLECOES.users, u.uid));
          setPerfil(
            snap.exists() ? ({ uid: u.uid, ...(snap.data() as Omit<Perfil, "uid">) }) : null,
          );
          setErro(undefined);
        } catch (e) {
          setErro(explicar(e));
        } finally {
          setCarregando(false);
        }
      },
      (e) => {
        clearTimeout(relogio);
        setErro(explicar(e));
        setCarregando(false);
      },
    );

    return () => {
      clearTimeout(relogio);
      cancelar();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        usuario,
        perfil,
        carregando,
        erro,
        sair: async () => void (await fbSignOut(auth())),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useFirebase() {
  return useContext(Ctx);
}
