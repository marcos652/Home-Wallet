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
  sair: () => Promise<void>;
};

const Ctx = createContext<Estado>({
  usuario: null,
  perfil: null,
  carregando: true,
  sair: async () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth(), async (u) => {
      setUsuario(u);

      if (!u) {
        setPerfil(null);
        setCarregando(false);
        return;
      }

      // O cadastro (nome, papel, situação) mora no Firestore; o Auth só guarda
      // a credencial.
      const snap = await getDoc(doc(db(), COLECOES.users, u.uid));
      setPerfil(
        snap.exists()
          ? ({ uid: u.uid, ...(snap.data() as Omit<Perfil, "uid">) })
          : null,
      );
      setCarregando(false);
    });
  }, []);

  return (
    <Ctx.Provider
      value={{ usuario, perfil, carregando, sair: async () => void (await fbSignOut(auth())) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useFirebase() {
  return useContext(Ctx);
}
