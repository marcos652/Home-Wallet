"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFirebase } from "@/components/auth/firebase-provider";
import { importarDoEmail } from "@/lib/email/importar";
import { formatDateTime } from "@/lib/format";

export function SyncModal({
  lastSyncAt,
  onImportou,
}: {
  lastSyncAt: Date | null;
  onImportou: () => void;
}) {
  const { perfil } = useFirebase();
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string }>();
  const [pendente, iniciar] = useTransition();

  function sincronizar() {
    if (!perfil) return;
    iniciar(async () => {
      try {
        const r = await importarDoEmail(perfil.uid);
        setResultado({
          ok: true,
          texto:
            r.importados > 0
              ? `${r.importados} transação(ões) importada(s) de ${r.lidos} email(s).`
              : `Nenhuma transação nova (${r.lidos} email(s) verificado(s)).`,
        });
        if (r.importados > 0) onImportou();
      } catch (e) {
        setResultado({
          ok: false,
          texto: e instanceof Error ? e.message : "Falha na sincronização",
        });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        setOpen(aberto);
        if (!aberto) setResultado(undefined);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <RefreshCw className="size-4" strokeWidth={1.75} />
        Sincronizar
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sincronizar com o email</DialogTitle>
          <DialogDescription>
            Lê os avisos do banco no seu Gmail e lança as transações novas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Última sincronização</span>
              <span className="font-medium">
                {lastSyncAt ? formatDateTime(lastSyncAt) : "ainda não sincronizado"}
              </span>
            </div>
          </div>

          {resultado && (
            <p
              className={`flex items-start gap-2 text-sm ${
                resultado.ok ? "text-income" : "text-destructive"
              }`}
            >
              {resultado.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              )}
              {resultado.texto}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Fechar</DialogClose>
          <Button type="button" onClick={sincronizar} disabled={pendente}>
            {pendente ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" strokeWidth={1.75} />
            )}
            {pendente ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
