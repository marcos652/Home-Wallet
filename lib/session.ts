import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado");
  }
  return session.user;
}

export async function requireMaster() {
  const user = await requireUser();
  if (user.role !== "MASTER") {
    throw new Error("Acesso restrito ao master");
  }
  return user;
}

// Reads the live user record instead of trusting the JWT, so profile edits show
// up immediately and a user deactivated by the master loses access on the next
// request instead of only at the next login. Every route that branches on the
// session must use this — if some routes trusted the JWT instead, a stale cookie
// for a deactivated user would bounce between them in a redirect loop.
export async function getActiveUserRecord() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return user && user.status === "ACTIVE" ? user : null;
}

export async function requireActiveUserRecord() {
  const user = await getActiveUserRecord();
  if (!user) {
    redirect("/login");
  }
  return user;
}
