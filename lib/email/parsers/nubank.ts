import { parseBrlAmount } from "@/lib/email/parse-amount";

export type ParsedTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date;
};

export type EmailInput = {
  subject: string;
  text: string;
  date: Date;
};

type Rule = {
  name: string;
  type: "INCOME" | "EXPENSE";
  pattern: RegExp;
  describe: (subject: string) => string;
};

// Patterns taken from real Nubank notification emails. The amount always sits
// in a "Valor enviado/recebido: R$ x" label; the counterparty name is not in the
// email, so the description comes from the notification type.
// Ordered — first match wins, so keep the specific rules above the generic ones.
const RULES: Rule[] = [
  {
    name: "valor-enviado",
    type: "EXPENSE",
    pattern: /valor\s+enviado\s*:?\s*R\$\s*([\d.,]+)/i,
    describe: (subject) =>
      /pix/i.test(subject) ? "Transferência enviada (Pix)" : "Transferência enviada",
  },
  {
    name: "valor-recebido",
    type: "INCOME",
    pattern: /valor\s+recebido\s*:?\s*R\$\s*([\d.,]+)/i,
    describe: (subject) =>
      /pix/i.test(subject) ? "Transferência recebida (Pix)" : "Transferência recebida",
  },
  {
    name: "pagamento-fatura",
    type: "EXPENSE",
    pattern: /pagamento\s+de\s+R\$\s*([\d.,]+)\s+da\s+sua\s+fatura/i,
    describe: () => "Pagamento de fatura",
  },
  {
    name: "compra-aprovada",
    type: "EXPENSE",
    pattern: /compra\s+(?:de\s+)?R\$\s*([\d.,]+)\s+(?:foi\s+)?(?:aprovada\s+)?(?:em|no|na)\s+([^\n.]{2,60})/i,
    describe: () => "Compra no cartão",
  },
];

// Marketing and statement emails also mention values; never import from these.
const IGNORED_SUBJECTS =
  /fatura\s+(?:está\s+)?fechada|extrato|antecipar|conheça|vote|convide|indique|novidade/i;

function normalize(text: string) {
  return text
    .replace(/\r/g, " ")
    .replace(/[​‌ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNubankEmail(input: EmailInput): ParsedTransaction | null {
  if (IGNORED_SUBJECTS.test(input.subject)) return null;

  const haystack = normalize(`${input.subject} ${input.text}`);

  for (const rule of RULES) {
    const match = haystack.match(rule.pattern);
    if (!match) continue;

    const amount = parseBrlAmount(match[1] ?? "");
    if (amount === null) continue;

    return {
      type: rule.type,
      amount,
      description: rule.describe(input.subject),
      date: input.date,
    };
  }

  return null;
}
