"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db, COLECOES } from "@/lib/firebase-client";

const CATEGORIAS_PADRAO = [
  { name: "Salário", type: "INCOME", icon: "wallet", color: "#22c55e" },
  { name: "Outras receitas", type: "INCOME", icon: "plus-circle", color: "#16a34a" },
  { name: "Moradia", type: "EXPENSE", icon: "home", color: "#ef4444" },
  { name: "Alimentação", type: "EXPENSE", icon: "utensils", color: "#f97316" },
  { name: "Transporte", type: "EXPENSE", icon: "car", color: "#3b82f6" },
  { name: "Saúde", type: "EXPENSE", icon: "heart-pulse", color: "#ec4899" },
  { name: "Lazer", type: "EXPENSE", icon: "popcorn", color: "#a855f7" },
  { name: "Outros", type: "EXPENSE", icon: "circle", color: "#64748b" },
];

function mensagemDeErro(codigo: string) {
  if (codigo === "auth/email-already-in-use") return "Já existe uma conta com este email";
  if (codigo === "auth/weak-password") return "A senha deve ter ao menos 6 caracteres";
  if (codigo === "auth/invalid-email") return "Email inválido";
  return "Não foi possível criar a conta";
}

export function RegisterForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function cadastrar(formData: FormData) {
    const nome = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const senha = String(formData.get("password") ?? "");

    iniciar(async () => {
      try {
        const cred = await createUserWithEmailAndPassword(auth(), email, senha);
        const uid = cred.user.uid;

        await setDoc(doc(db(), COLECOES.users, uid), {
          name: nome,
          email,
          role: "USER",
          status: "ACTIVE",
          createdAt: Timestamp.now(),
        });

        await Promise.all([
          addDoc(collection(db(), COLECOES.accounts), {
            userId: uid,
            name: "Carteira principal",
            type: "CHECKING",
            balance: 0,
            currency: "BRL",
            archived: false,
            createdAt: Timestamp.now(),
          }),
          ...CATEGORIAS_PADRAO.map((c) =>
            addDoc(collection(db(), COLECOES.categories), { userId: uid, ...c }),
          ),
        ]);

        router.replace("/");
      } catch (e) {
        setErro(mensagemDeErro((e as { code?: string })?.code ?? ""));
      }
    });
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>Comece a organizar suas finanças</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={cadastrar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" name="name" placeholder="Seu nome" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="mt-1 w-full" disabled={pendente}>
            {pendente && <Loader2 className="size-4 animate-spin" />}
            Criar conta
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
