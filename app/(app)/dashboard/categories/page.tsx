"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/components/auth/firebase-provider";
import { useAsync } from "@/lib/use-async";
import { listarCategorias, type Categoria } from "@/lib/data";
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog";
import { CategoryListItem } from "@/components/dashboard/category-list-item";

function Coluna({
  titulo,
  tipo,
  categorias,
  carregando,
  onMudou,
}: {
  titulo: string;
  tipo: "INCOME" | "EXPENSE";
  categorias: Categoria[];
  carregando: boolean;
  onMudou: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{titulo}</CardTitle>
        <CategoryFormDialog type={tipo} onSalvo={onMudou} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {carregando ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : categorias.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria</p>
        ) : (
          categorias.map((c) => <CategoryListItem key={c.id} categoria={c} onMudou={onMudou} />)
        )}
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const { perfil } = useFirebase();
  const uid = perfil?.uid;

  const { dados, carregando, recarregar } = useAsync(
    async () => (uid ? listarCategorias(uid) : []),
    [uid],
  );

  const categorias = dados ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">Organize receitas e despesas.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Coluna
          titulo="Receitas"
          tipo="INCOME"
          categorias={categorias.filter((c) => c.type === "INCOME")}
          carregando={carregando}
          onMudou={recarregar}
        />
        <Coluna
          titulo="Despesas"
          tipo="EXPENSE"
          categorias={categorias.filter((c) => c.type === "EXPENSE")}
          carregando={carregando}
          onMudou={recarregar}
        />
      </div>
    </div>
  );
}
