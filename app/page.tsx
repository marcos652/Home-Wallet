"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirebase } from "@/components/auth/firebase-provider";

export default function Home() {
  const { perfil, carregando } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    if (!perfil) router.replace("/login");
    else router.replace(perfil.role === "MASTER" ? "/master" : "/dashboard");
  }, [carregando, perfil, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
