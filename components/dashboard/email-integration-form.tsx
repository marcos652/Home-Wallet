"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveEmailIntegration, runEmailSync } from "@/lib/actions/email-integration";
import { formatDateTime } from "@/lib/format";

type AccountOption = { id: string; name: string };

export function EmailIntegrationForm({
  accounts,
  integration,
}: {
  accounts: AccountOption[];
  integration: {
    enabled: boolean;
    imapUser: string;
    defaultAccountId: string | null;
    lastSyncAt: Date | null;
    lastSyncError: string | null;
    hasPassword: boolean;
  } | null;
}) {
  const [error, setError] = useState<string>();
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();

  // Controlled: this card stays mounted while the page revalidates after a save,
  // so uncontrolled defaultValues would change after init and Base UI warns.
  const [enabled, setEnabled] = useState(integration?.enabled ?? false);
  const [imapUser, setImapUser] = useState(integration?.imapUser ?? "");
  const [accountId, setAccountId] = useState(integration?.defaultAccountId ?? "");

  function handleSave(formData: FormData) {
    // Written from state rather than trusting the Select's hidden input, whose
    // presence is an internal detail of the component library.
    formData.set("defaultAccountId", accountId);

    startSaving(async () => {
      const result = await saveEmailIntegration(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      toast.success("Integração salva");
    });
  }

  function handleSync() {
    startSyncing(async () => {
      const result = await runEmailSync();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.summary ?? "Sincronização concluída");
    });
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre uma conta antes de configurar a importação por email.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={handleSave} className="flex flex-col gap-4">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-4 accent-primary"
          />
          Ativar importação automática
        </label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="imapUser">Gmail que recebe os avisos</Label>
          <Input
            id="imapUser"
            name="imapUser"
            type="email"
            value={imapUser}
            onChange={(event) => setImapUser(event.target.value)}
            placeholder="voce@gmail.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="imapPassword">Senha de app do Google</Label>
          <Input
            id="imapPassword"
            name="imapPassword"
            type="password"
            placeholder={integration?.hasPassword ? "•••••••• (salva)" : "abcd efgh ijkl mnop"}
          />
          <p className="text-xs text-muted-foreground">
            Gere em myaccount.google.com → Segurança → Verificação em duas etapas → Senhas de app.
            Não é a senha da sua conta Google.
            {integration?.hasPassword && " Deixe vazio para manter a atual."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="defaultAccountId">Conta que recebe os lançamentos</Label>
          <Select
            name="defaultAccountId"
            value={accountId}
            onValueChange={(value) => setAccountId(typeof value === "string" ? value : "")}
          >
            <SelectTrigger id="defaultAccountId" className="w-full">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Salvar integração
          </Button>
        </div>
      </form>

      {integration && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-sm">
              {integration.lastSyncError ? (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="size-4" strokeWidth={1.75} />
                  {integration.lastSyncError}
                </span>
              ) : integration.lastSyncAt ? (
                <span className="flex items-center gap-1.5 text-income">
                  <CheckCircle2 className="size-4" strokeWidth={1.75} />
                  Última sincronização: {formatDateTime(integration.lastSyncAt)}
                </span>
              ) : (
                <span className="text-muted-foreground">Ainda não sincronizado.</span>
              )}
            </div>

            <Button type="button" variant="outline" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" strokeWidth={1.75} />
              )}
              Sincronizar agora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
