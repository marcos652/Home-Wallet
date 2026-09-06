"use client";

import { useRef, useState, useTransition } from "react";
import { updatePassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/components/auth/firebase-provider";
import { atualizarNome } from "@/lib/data";
import { auth } from "@/lib/firebase-client";

function mensagemDeErro(codigo: string) {
  if (codigo === "auth/requires-recent-login") return "Entre novamente para alterar a senha";
  if (codigo === "auth/weak-password") return "A senha deve ter ao menos 6 caracteres";
  return "Não foi possível atualizar a senha";
}

export default function MasterSettingsPage() {
  const { perfil } = useFirebase();
  const [erroPerfil, setErroPerfil] = useState<string>();
  const [erroSenha, setErroSenha] = useState<string>();
  const [salvandoPerfil, salvarPerfil] = useTransition();
  const [salvandoSenha, salvarSenha] = useTransition();
  const formSenha = useRef<HTMLFormElement>(null);

  if (!perfil) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function atualizarPerfil(formData: FormData) {
    if (!perfil) return;
    const nome = String(formData.get("name") ?? "").trim();
    if (!nome) return setErroPerfil("Informe seu nome");

    salvarPerfil(async () => {
      try {
        await atualizarNome(perfil.uid, nome);
        setErroPerfil(undefined);
        toast.success("Perfil atualizado");
      } catch (e) {
        setErroPerfil(e instanceof Error ? e.message : "Não foi possível salvar");
      }
    });
  }

  // A senha vive no Firebase Auth, não no Firestore: quem troca é o próprio SDK.
  function trocarSenha(formData: FormData) {
    const nova = String(formData.get("newPassword") ?? "");

    salvarSenha(async () => {
      const usuario = auth().currentUser;
      if (!usuario) {
        setErroSenha(mensagemDeErro("auth/requires-recent-login"));
        return;
      }
      try {
        await updatePassword(usuario, nova);
        setErroSenha(undefined);
        formSenha.current?.reset();
        toast.success("Senha atualizada");
      } catch (e) {
        setErroSenha(mensagemDeErro((e as { code?: string })?.code ?? ""));
      }
    });
  }

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
          <form action={atualizarPerfil} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={perfil.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={perfil.email} disabled />
            </div>
            {erroPerfil && <p className="text-sm text-destructive">{erroPerfil}</p>}
            <div>
              <Button type="submit" disabled={salvandoPerfil}>
                {salvandoPerfil && <Loader2 className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formSenha} action={trocarSenha} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" name="newPassword" type="password" required />
            </div>
            {erroSenha && <p className="text-sm text-destructive">{erroSenha}</p>}
            <div>
              <Button type="submit" disabled={salvandoSenha}>
                {salvandoSenha && <Loader2 className="size-4 animate-spin" />}
                Atualizar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
