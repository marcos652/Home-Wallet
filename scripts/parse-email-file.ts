import { readFileSync } from "node:fs";
import { simpleParser } from "mailparser";
import { parseNubankEmail } from "../lib/email/parsers/nubank";

// Built-in samples, used when no file is passed. Double as a regression check
// for the rule table in lib/email/parsers/nubank.ts.
const SAMPLES = [
  { subject: "Compra aprovada", text: "Compra de R$ 45,90 aprovada em PADARIA DO ZE." },
  { subject: "Nova compra", text: "Valor: R$ 1.234,56\nEstabelecimento: SUPERMERCADO EXTRA" },
  { subject: "Comprovante de Pix", text: "Você enviou um Pix de R$ 250,00 para Joao Silva." },
  { subject: "Pix recebido", text: "Você recebeu um Pix de R$ 3.000,00 de MOVINGPAY LTDA." },
  { subject: "Novidades", text: "Conheça nossos novos produtos." },
];

function show(label: string, parsed: ReturnType<typeof parseNubankEmail>) {
  if (!parsed) {
    console.log(`  IGNORADO  ${label}`);
    console.log("            Nenhuma regra reconheceu este email.");
    return;
  }
  console.log(`  OK        ${label}`);
  console.log(`            tipo:      ${parsed.type}`);
  console.log(`            valor:     R$ ${parsed.amount.toFixed(2)}`);
  console.log(`            descrição: ${parsed.description}`);
  console.log(`            data:      ${parsed.date.toLocaleDateString("pt-BR")}`);
}

async function main() {
  const file = process.argv[2];

  if (!file) {
    console.log("Amostras internas (passe um arquivo .eml/.txt para testar um email real):\n");
    for (const sample of SAMPLES) {
      show(sample.subject, parseNubankEmail({ ...sample, date: new Date() }));
    }
    return;
  }

  const raw = readFileSync(file);
  const mail = await simpleParser(raw);
  const subject = mail.subject ?? "";
  const text = mail.text ?? raw.toString("utf8");

  console.log(`Arquivo:  ${file}`);
  console.log(`Assunto:  ${subject || "(sem assunto)"}`);
  console.log(`De:       ${mail.from?.text ?? "(desconhecido)"}\n`);

  show(subject || file, parseNubankEmail({ subject, text, date: mail.date ?? new Date() }));

  console.log("\n--- corpo lido pelo parser (primeiros 600 caracteres) ---");
  console.log(text.slice(0, 600));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
