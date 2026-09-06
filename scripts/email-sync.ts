import "dotenv/config";
import { prisma } from "../lib/prisma";
import { syncEmailTransactions } from "../lib/email/sync";

async function main() {
  const integrations = await prisma.emailIntegration.findMany({
    where: { enabled: true },
    include: { user: { select: { email: true, status: true } } },
  });

  if (integrations.length === 0) {
    console.log("Nenhuma integração de email ativa.");
    return;
  }

  for (const integration of integrations) {
    if (integration.user.status !== "ACTIVE") continue;

    const label = integration.user.email;
    try {
      const result = await syncEmailTransactions(integration.userId);
      console.log(
        `[${label}] ${result.imported} importada(s), ${result.duplicates} duplicada(s), ` +
          `${result.skipped} ignorada(s), ${result.scanned} email(s) lido(s).`,
      );
    } catch (error) {
      console.error(`[${label}] falhou:`, error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
