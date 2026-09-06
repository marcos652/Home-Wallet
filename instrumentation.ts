export async function register() {
  // Only the Node runtime can talk to IMAP and Prisma.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startEmailScheduler } = await import("@/lib/email/scheduler");
  startEmailScheduler();
}
