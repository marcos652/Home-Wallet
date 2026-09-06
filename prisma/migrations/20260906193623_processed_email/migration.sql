-- CreateTable
CREATE TABLE "ProcessedEmail" (
    "messageId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "ProcessedEmail_userId_idx" ON "ProcessedEmail"("userId");
