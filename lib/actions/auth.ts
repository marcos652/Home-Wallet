"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { signIn, signOut } from "@/auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }
}

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

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta com este email" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      accounts: {
        create: {
          name: "Carteira principal",
          type: "CHECKING",
          balance: 0,
        },
      },
      categories: {
        create: DEFAULT_CATEGORIES,
      },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/" });
  return { success: true };
}
