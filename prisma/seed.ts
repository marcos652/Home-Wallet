import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: "Salário", type: "INCOME" as const, icon: "wallet", color: "#22c55e" },
  { name: "Outras receitas", type: "INCOME" as const, icon: "plus-circle", color: "#16a34a" },
  { name: "Moradia", type: "EXPENSE" as const, icon: "home", color: "#ef4444" },
  { name: "Alimentação", type: "EXPENSE" as const, icon: "utensils", color: "#f97316" },
  { name: "Transporte", type: "EXPENSE" as const, icon: "car", color: "#3b82f6" },
  { name: "Saúde", type: "EXPENSE" as const, icon: "heart-pulse", color: "#ec4899" },
  { name: "Lazer", type: "EXPENSE" as const, icon: "popcorn", color: "#a855f7" },
  { name: "Outros", type: "EXPENSE" as const, icon: "circle", color: "#64748b" },
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Anchors a date inside the current month (never in the future) so the
// "deste mês" totals and charts always have data, whatever day the seed runs.
function thisMonth(day: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()), 12);
}

async function createDemoUser(opts: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);

  const user = await prisma.user.create({
    data: {
      name: opts.name,
      email: opts.email,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      categories: { create: DEFAULT_CATEGORIES },
      accounts: {
        create: [
          { name: "Conta corrente", type: "CHECKING", balance: 0 },
          { name: "Cartão de crédito", type: "CREDIT_CARD", balance: 0 },
          { name: "Reserva de emergência", type: "SAVINGS", balance: 0 },
        ],
      },
    },
    include: { accounts: true, categories: true },
  });

  const checking = user.accounts.find((a) => a.type === "CHECKING")!;
  const credit = user.accounts.find((a) => a.type === "CREDIT_CARD")!;
  const savings = user.accounts.find((a) => a.type === "SAVINGS")!;

  const byName = (name: string) => user.categories.find((c) => c.name === name)!.id;

  type Seed = {
    accountId: string;
    categoryId: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date: Date;
  };

  const salary = 3800 + Math.round(Math.random() * 1200);

  const seedTx: Seed[] = [
    { accountId: checking.id, categoryId: byName("Salário"), type: "INCOME", amount: salary, description: "Salário mensal", date: daysAgo(58) },
    { accountId: checking.id, categoryId: byName("Salário"), type: "INCOME", amount: salary, description: "Salário mensal", date: daysAgo(28) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 1350, description: "Aluguel", date: daysAgo(55) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 1350, description: "Aluguel", date: daysAgo(25) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 210, description: "Condomínio", date: daysAgo(54) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 215, description: "Condomínio", date: daysAgo(24) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 92.5, description: "Supermercado", date: daysAgo(50) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 64.9, description: "Restaurante", date: daysAgo(45) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 38.2, description: "iFood", date: daysAgo(40) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 105.4, description: "Supermercado", date: daysAgo(20) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 47.0, description: "Restaurante", date: daysAgo(12) },
    { accountId: credit.id, categoryId: byName("Transporte"), type: "EXPENSE", amount: 180, description: "Combustível", date: daysAgo(48) },
    { accountId: credit.id, categoryId: byName("Transporte"), type: "EXPENSE", amount: 35.9, description: "Uber", date: daysAgo(33) },
    { accountId: credit.id, categoryId: byName("Transporte"), type: "EXPENSE", amount: 160, description: "Combustível", date: daysAgo(18) },
    { accountId: credit.id, categoryId: byName("Saúde"), type: "EXPENSE", amount: 220, description: "Plano de saúde", date: daysAgo(52) },
    { accountId: credit.id, categoryId: byName("Saúde"), type: "EXPENSE", amount: 89.9, description: "Farmácia", date: daysAgo(15) },
    { accountId: credit.id, categoryId: byName("Lazer"), type: "EXPENSE", amount: 55.9, description: "Cinema", date: daysAgo(38) },
    { accountId: credit.id, categoryId: byName("Lazer"), type: "EXPENSE", amount: 39.9, description: "Streaming", date: daysAgo(10) },
    { accountId: checking.id, categoryId: byName("Outros"), type: "EXPENSE", amount: 120, description: "Diversos", date: daysAgo(8) },
    { accountId: checking.id, categoryId: byName("Outras receitas"), type: "INCOME", amount: 450, description: "Freelance", date: daysAgo(6) },
    { accountId: savings.id, categoryId: byName("Outras receitas"), type: "INCOME", amount: 500, description: "Aporte mensal", date: daysAgo(27) },

    { accountId: checking.id, categoryId: byName("Salário"), type: "INCOME", amount: salary, description: "Salário mensal", date: thisMonth(5) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 1350, description: "Aluguel", date: thisMonth(6) },
    { accountId: checking.id, categoryId: byName("Moradia"), type: "EXPENSE", amount: 218, description: "Condomínio", date: thisMonth(6) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 143.8, description: "Supermercado", date: thisMonth(8) },
    { accountId: credit.id, categoryId: byName("Alimentação"), type: "EXPENSE", amount: 52.4, description: "Restaurante", date: thisMonth(12) },
    { accountId: credit.id, categoryId: byName("Transporte"), type: "EXPENSE", amount: 175, description: "Combustível", date: thisMonth(10) },
    { accountId: credit.id, categoryId: byName("Transporte"), type: "EXPENSE", amount: 28.5, description: "Uber", date: thisMonth(14) },
    { accountId: credit.id, categoryId: byName("Saúde"), type: "EXPENSE", amount: 220, description: "Plano de saúde", date: thisMonth(9) },
    { accountId: credit.id, categoryId: byName("Lazer"), type: "EXPENSE", amount: 39.9, description: "Streaming", date: thisMonth(11) },
    { accountId: savings.id, categoryId: byName("Outras receitas"), type: "INCOME", amount: 500, description: "Aporte mensal", date: thisMonth(7) },
  ];

  await prisma.transaction.createMany({ data: seedTx });

  const balanceByAccount = new Map<string, number>();
  for (const tx of seedTx) {
    const delta = tx.type === "EXPENSE" ? -tx.amount : tx.amount;
    balanceByAccount.set(tx.accountId, (balanceByAccount.get(tx.accountId) ?? 0) + delta);
  }
  for (const [accountId, balance] of balanceByAccount) {
    await prisma.account.update({ where: { id: accountId }, data: { balance } });
  }

  return user;
}

async function main() {
  // Idempotent: wipe the demo data so the seed can be re-run at any time.
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const masterPasswordHash = await bcrypt.hash("master123", 10);
  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "master@homewallet.app",
      passwordHash: masterPasswordHash,
      role: "MASTER",
      status: "ACTIVE",
    },
  });

  await createDemoUser({
    name: "Ana Souza",
    email: "ana@homewallet.app",
    password: "demo123",
  });

  await createDemoUser({
    name: "Bruno Lima",
    email: "bruno@homewallet.app",
    password: "demo123",
  });

  console.log("Seed concluído:");
  console.log("  Master:  master@homewallet.app / master123");
  console.log("  Usuário: ana@homewallet.app / demo123");
  console.log("  Usuário: bruno@homewallet.app / demo123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
