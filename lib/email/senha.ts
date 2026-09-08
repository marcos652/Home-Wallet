import { decrypt } from "@/lib/crypto";

/**
 * A senha de app do Gmail existe em dois formatos no banco: o valor
 * criptografado que veio da migração do Prisma (`iv:tag:dados`, decifrável
 * apenas no servidor) e o texto puro que o app grava hoje, protegido pelas
 * regras do Firestore. Só o servidor chama isto — o navegador não tem a chave.
 */
export function senhaDoImap(guardada: string) {
  if (guardada.split(":").length !== 3) return guardada;
  try {
    return decrypt(guardada);
  } catch {
    return guardada;
  }
}
