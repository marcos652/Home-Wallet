"use client";

import { AlertCircle, Loader2 } from "lucide-react";

export function Carregando() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Sem isto uma consulta que falha deixa a tela girando para sempre. */
export function Falhou({ erro }: { erro: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertCircle className="size-5 text-destructive" strokeWidth={1.75} />
      <p className="text-sm font-medium text-destructive">Não foi possível carregar os dados</p>
      <p className="max-w-md px-4 text-xs text-muted-foreground">{erro}</p>
    </div>
  );
}
