import { prisma } from "@/lib/prisma";
import { syncEmailTransactions } from "@/lib/email/sync";

const DEFAULT_MINUTES = 15;

// Survives hot-reload in dev, which would otherwise stack a new interval on
// every recompile and run the sync many times over.
const globalForScheduler = globalThis as unknown as {
  emailSyncTimer: NodeJS.Timeout | undefined;
};

async function runOnce() {
  const integrations = await prisma.emailIntegration.findMany({
    where: { enabled: true, user: { status: "ACTIVE" } },
    select: { userId: true, user: { select: { email: true } } },
  });

  for (const integration of integrations) {
    try {
      const result = await syncEmailTransactions(integration.userId);
      if (result.imported > 0) {
        console.log(
          `[email-sync] ${integration.user.email}: ${result.imported} transação(ões) importada(s)`,
        );
      }
    } catch (error) {
      // Already recorded in lastSyncError for the settings screen; never let a
      // failed sync take the server down.
      console.error(
        `[email-sync] ${integration.user.email}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}

export function startEmailScheduler() {
  if (globalForScheduler.emailSyncTimer) return;

  const minutes = Number(process.env.EMAIL_SYNC_INTERVAL_MINUTES) || DEFAULT_MINUTES;
  const intervalMs = minutes * 60 * 1000;

  globalForScheduler.emailSyncTimer = setInterval(() => {
    void runOnce();
  }, intervalMs);

  // Do not hold the process open just for this timer.
  globalForScheduler.emailSyncTimer.unref?.();

  console.log(`[email-sync] agendador ativo — a cada ${minutes} min`);
  void runOnce();
}
