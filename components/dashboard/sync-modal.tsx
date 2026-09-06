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
import { runEmailSync } from "@/lib/actions/email-integration";
import { formatDateTime } from "@/lib/format";

type Resultado = { ok: boolean; mensagem: string };

export function SyncModal({
  lastSyncAt,
  lastSyncError,
}: {
  lastSyncAt: Date | null;
  lastSyncError: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<Resultado>();
  const [isPending, startTransition] = useTransition();

  function sincronizar() {
    startTransition(async () => {
      const r = await runEmailSync();
      setResultado(
        r.error
          ? { ok: false, mensagem: r.error }
          : { ok: true, mensagem: r.summary ?? "Sincronização concluída" },
      );
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

          {lastSyncError && !resultado && (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              {lastSyncError}
            </p>
          )}

          {resultado && (
            <p
              className={
                resultado.ok
                  ? "flex items-start gap-2 text-sm text-income"
                  : "flex items-start gap-2 text-sm text-destructive"
              }
            >
              {resultado.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              )}
              {resultado.mensagem}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Fechar</DialogClose>
          <Button type="button" onClick={sincronizar} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" strokeWidth={1.75} />
            )}
            {isPending ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
