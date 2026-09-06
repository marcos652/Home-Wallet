import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome para a conta"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH"]),
  balance: z.coerce.number().finite("Informe um saldo válido"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe um nome para a categoria"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().trim().min(1).default("circle"),
  color: z.string().trim().min(1).default("#6366f1"),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1, "Selecione uma conta"),
  categoryId: z.string().optional().nullable(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  description: z.string().trim().min(1, "Informe uma descrição"),
  date: z.coerce.date(),
});
