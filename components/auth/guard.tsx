"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";

function Carregando() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Sem isto, uma falha de configuração deixa a tela girando sem explicação. */
function ErroDeConexao({ erro }: { erro: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="size-6 text-destructive" strokeWidth={1.75} />
        <p className="font-medium text-destructive">Não foi possível conectar</p>
        <p className="text-sm text-muted-foreground">{erro}</p>
      </div>
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
  const { perfil, carregando, erro } = useFirebase();
  const router = useRouter();

  const destinoErrado = perfil && perfil.role !== papel;
  const inativo = perfil?.status === "INACTIVE";

  useEffect(() => {
    if (carregando || erro) return;
    if (!perfil || inativo) {
      router.replace("/login");
      return;
    }
    if (destinoErrado) {
      router.replace(perfil.role === "MASTER" ? "/master" : "/dashboard");
    }
  }, [carregando, erro, perfil, inativo, destinoErrado, router]);

  if (erro) return <ErroDeConexao erro={erro} />;
  if (carregando || !perfil || inativo || destinoErrado) return <Carregando />;
  return <>{children}</>;
}

/** Inverso: as telas de login/cadastro não devem aparecer para quem já entrou. */
export function GuardVisitante({ children }: { children: React.ReactNode }) {
  const { perfil, carregando, erro } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !erro && perfil) router.replace("/");
  }, [carregando, erro, perfil, router]);

  if (erro) return <ErroDeConexao erro={erro} />;
  if (carregando || perfil) return <Carregando />;
  return <>{children}</>;
}
