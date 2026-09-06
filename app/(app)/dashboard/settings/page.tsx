"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { auth } from "@/lib/firebase-client";
import { listarContas, buscarIntegracao, salvarIntegracao, atualizarNome } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

function Perfil() {
  const { perfil } = useFirebase();
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    if (!perfil) return;
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return setErro("Informe seu nome completo");

    iniciar(async () => {
      try {
        await atualizarNome(perfil.uid, name);
        setErro(undefined);
        toast.success("Perfil atualizado — recarregue para ver em todo o app");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={perfil?.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={perfil?.email ?? ""} disabled />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <div>
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function Senha() {
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    const nova = String(formData.get("newPassword") ?? "");
    if (nova.length < 6) return setErro("A nova senha deve ter ao menos 6 caracteres");

    iniciar(async () => {
      const usuario = auth().currentUser;
      if (!usuario) return setErro("Sessão expirada — entre novamente");
      try {
        await updatePassword(usuario, nova);
        setErro(undefined);
        toast.success("Senha atualizada");
      } catch (e) {
        const codigo = (e as { code?: string })?.code;
        setErro(
          codigo === "auth/requires-recent-login"
            ? "Por segurança, saia e entre de novo antes de trocar a senha"
            : "Não foi possível atualizar a senha",
        );
      }
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <div>
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="size-4 animate-spin" />}
          Atualizar senha
        </Button>
      </div>
    </form>
  );
}

function Integracao() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  const { dados, carregando, recarregar } = useAsync(async () => {
    if (!uid) return null;
    const [contas, integracao] = await Promise.all([listarContas(uid), buscarIntegracao(uid)]);
    return { contas: contas.filter((c) => !c.archived), integracao };
  }, [uid]);

  const [ativa, setAtiva] = useState<boolean>();
  const [contaId, setContaId] = useState<string>();

  if (carregando || !dados) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dados.contas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre uma conta antes de configurar a importação por email.
      </p>
    );
  }

  const enabled = ativa ?? dados.integracao?.enabled ?? false;
  const destino = contaId ?? dados.integracao?.defaultAccountId ?? "";

  function salvar(formData: FormData) {
    if (!uid) return;
    const imapUser = String(formData.get("imapUser") ?? "").trim();
    const senha = String(formData.get("imapPassword") ?? "").replace(/\s+/g, "");
    const guardada = dados?.integracao?.imapPasswordEnc ?? "";

    if (!imapUser) return setErro("Informe o endereço Gmail");
    if (!destino) return setErro("Escolha a conta de destino");
    if (!senha && !guardada) return setErro("Informe a senha de app do Gmail");

    iniciar(async () => {
      try {
        await salvarIntegracao(uid, {
          enabled,
          imapUser,
          imapPasswordEnc: senha || guardada,
          defaultAccountId: destino,
        });
        setErro(undefined);
        toast.success("Integração salva");
        recarregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={salvar} className="flex flex-col gap-4">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setAtiva(e.target.checked)}
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
            defaultValue={dados.integracao?.imapUser}
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
            placeholder={dados.integracao?.imapPasswordEnc ? "•••••••• (salva)" : "abcd efgh ijkl mnop"}
          />
          <p className="text-xs text-muted-foreground">
            Gere em myaccount.google.com → Segurança → Senhas de app. Não é a senha da sua conta.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conta">Conta que recebe os lançamentos</Label>
          <Select value={destino} onValueChange={(v) => setContaId(typeof v === "string" ? v : "")}>
            <SelectTrigger id="conta" className="w-full">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {dados.contas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div>
          <Button type="submit" disabled={pendente}>
            {pendente && <Loader2 className="size-4 animate-spin" />}
            Salvar integração
          </Button>
        </div>
      </form>

      {dados.integracao && (
        <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          Última sincronização:{" "}
          {dados.integracao.lastSyncAt
            ? formatDateTime(dados.integracao.lastSyncAt)
            : "ainda não sincronizado"}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados de acesso.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Perfil />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar do email</CardTitle>
          <CardDescription>
            Lê os avisos do Nubank no seu Gmail e lança as transações automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Integracao />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Senha />
        </CardContent>
      </Card>
    </div>
  );
}
