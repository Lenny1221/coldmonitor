-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateTable
CREATE TABLE "ReportDownloadLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "locationId" TEXT,
    "coldCellIds" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportDownloadLog_userId_idx" ON "ReportDownloadLog"("userId");

-- CreateIndex
CREATE INDEX "ReportDownloadLog_customerId_idx" ON "ReportDownloadLog"("customerId");

-- CreateIndex
CREATE INDEX "ReportDownloadLog_downloadedAt_idx" ON "ReportDownloadLog"("downloadedAt");
