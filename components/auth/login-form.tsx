"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase-client";

function mensagemDeErro(codigo: string) {
  // Falha de configuração não é culpa da senha: dizer "senha inválida" aqui
  // mandaria você caçar o problema no lugar errado.
  if (codigo === "auth/unauthorized-domain") {
    return "Este endereço não está liberado no Firebase (Authentication → Settings → Domínios autorizados).";
  }
  if (codigo === "auth/network-request-failed") return "Sem conexão. Verifique sua internet.";
  if (codigo === "auth/too-many-requests") {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }
  if (codigo === "auth/operation-not-allowed") {
    return "Login por email e senha está desativado no Firebase.";
  }
  // O Firebase não distingue email inexistente de senha errada quando a
  // proteção contra enumeração está ligada — e é melhor assim.
  return "Email ou senha inválidos";
}

export function LoginForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function entrar(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const senha = String(formData.get("password") ?? "");

    iniciar(async () => {
      try {
        await signInWithEmailAndPassword(auth(), email, senha);
        router.replace("/");
      } catch (e) {
        setErro(mensagemDeErro((e as { code?: string })?.code ?? ""));
      }
    });
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Entrar</CardTitle>
        <CardDescription>Acesse sua gestão financeira</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={entrar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="mt-1 w-full" disabled={pendente}>
            {pendente && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
