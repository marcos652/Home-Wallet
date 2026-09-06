import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog";
import { CategoryListItem } from "@/components/dashboard/category-list-item";

export default async function CategoriesPage() {
  const user = await requireUser();

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
    orderBy: { name: "asc" },
  });

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">Organize receitas e despesas.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Receitas</CardTitle>
            <CategoryFormDialog type="INCOME" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {incomeCategories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria</p>
            )}
            {incomeCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={{
                  id: category.id,
                  name: category.name,
                  color: category.color,
                  isOwn: category.userId === user.id,
                }}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Despesas</CardTitle>
            <CategoryFormDialog type="EXPENSE" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {expenseCategories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria</p>
            )}
            {expenseCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={{
                  id: category.id,
                  name: category.name,
                  color: category.color,
                  isOwn: category.userId === user.id,
                }}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
