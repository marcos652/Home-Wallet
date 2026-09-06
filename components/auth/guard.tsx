"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";

function Carregando() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Protege as áreas logadas. Como quem decide o acesso aos dados são as regras
 * do Firestore, isto aqui é navegação — não é a barreira de segurança.
 */
export function Guard({
  papel,
  children,
}: {
  papel: "MASTER" | "USER";
  children: React.ReactNode;
}) {
  const { perfil, carregando } = useFirebase();
  const router = useRouter();

  const destinoErrado = perfil && perfil.role !== papel;
  const inativo = perfil?.status === "INACTIVE";

  useEffect(() => {
    if (carregando) return;
    if (!perfil || inativo) {
      router.replace("/login");
      return;
    }
    if (destinoErrado) {
      router.replace(perfil.role === "MASTER" ? "/master" : "/dashboard");
    }
  }, [carregando, perfil, inativo, destinoErrado, router]);

  if (carregando || !perfil || inativo || destinoErrado) return <Carregando />;
  return <>{children}</>;
}

/** Inverso: as telas de login/cadastro não devem aparecer para quem já entrou. */
export function GuardVisitante({ children }: { children: React.ReactNode }) {
  const { perfil, carregando } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && perfil) router.replace("/");
  }, [carregando, perfil, router]);

  if (carregando || perfil) return <Carregando />;
  return <>{children}</>;
}
