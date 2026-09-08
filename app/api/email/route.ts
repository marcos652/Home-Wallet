import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { parseNubankEmail } from "@/lib/email/parsers/nubank";
import { htmlToText } from "@/lib/email/html-to-text";
import { senhaDoImap } from "@/lib/email/senha";

// IMAP não existe no navegador, então esta rota faz só a leitura da caixa e
// devolve o que entendeu. Quem grava no Firestore é o cliente, com a sessão do
// próprio usuário — assim as regras de segurança continuam valendo e o servidor
// nunca precisa de credencial de administrador.
export const runtime = "nodejs";
export const maxDuration = 60;

// Fixo: evita que a rota seja usada para abrir conexão com host arbitrário.
const HOST_PERMITIDO = "imap.gmail.com";
const REMETENTE = "nubank";
const DIAS_NA_PRIMEIRA_VEZ = 7;

export async function POST(request: Request) {
  let corpo: { imapUser?: string; imapPassword?: string; since?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { imapUser, imapPassword, since } = corpo;
  if (!imapUser || !imapPassword) {
    return NextResponse.json({ error: "Credenciais do email ausentes" }, { status: 400 });
  }

  const desde = since
    ? new Date(since)
    : new Date(Date.now() - DIAS_NA_PRIMEIRA_VEZ * 24 * 60 * 60 * 1000);

  const client = new ImapFlow({
    host: HOST_PERMITIDO,
    port: 993,
    secure: true,
    auth: { user: imapUser, pass: senhaDoImap(imapPassword) },
    logger: false,
  });

  const encontrados: {
    messageId: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date: string;
  }[] = [];
  let lidos = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const message of client.fetch(
        { from: REMETENTE, since: desde },
        { envelope: true, source: true },
      )) {
        lidos += 1;
        const messageId = message.envelope?.messageId;
        if (!messageId || !message.source) continue;

        const mail = await simpleParser(message.source);
        const lido = parseNubankEmail({
          subject: mail.subject ?? "",
          text: [mail.text ?? "", mail.html ? htmlToText(mail.html) : ""].join(" "),
          date: mail.date ?? message.envelope?.date ?? new Date(),
        });
        if (!lido) continue;

        encontrados.push({
          messageId,
          type: lido.type,
          amount: lido.amount,
          description: lido.description,
          date: lido.date.toISOString(),
        });
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao ler o email";
    const credencialRuim = /auth|credential|login/i.test(mensagem);
    return NextResponse.json(
      {
        error: credencialRuim
          ? "Gmail recusou a conexão. Confira o endereço e a senha de app."
          : mensagem,
      },
      { status: credencialRuim ? 401 : 502 },
    );
  } finally {
    await client.logout().catch(() => {});
  }

  return NextResponse.json({ lidos, encontrados });
}
