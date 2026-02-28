-- CreateEnum
CREATE TYPE "RefrigerantLogCategory" AS ENUM ('LEKCONTROLE', 'BIJVULLING', 'TERUGWINNING', 'ONDERHOUD_SERVICE', 'HERSTELLING_LEK', 'BUITENDIENSTSTELLING', 'EERSTE_INBEDRIJFSTELLING');

-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "installationNumber" TEXT,
ADD COLUMN     "isHermeticallySealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationDescription" TEXT,
ADD COLUMN     "modelNumber" TEXT,
ADD COLUMN     "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateTable
CREATE TABLE "RefrigerantLogEntry" (
    "id" TEXT NOT NULL,
    "category" "RefrigerantLogCategory" NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "technicianName" TEXT NOT NULL,
    "technicianCertNr" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,
    "data" JSONB NOT NULL,
    "installationId" TEXT NOT NULL,

    CONSTRAINT "RefrigerantLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefrigerantLogEntry_installationId_idx" ON "RefrigerantLogEntry"("installationId");

-- CreateIndex
CREATE INDEX "RefrigerantLogEntry_performedAt_idx" ON "RefrigerantLogEntry"("performedAt");

-- CreateIndex
CREATE INDEX "RefrigerantLogEntry_category_idx" ON "RefrigerantLogEntry"("category");

-- AddForeignKey
ALTER TABLE "RefrigerantLogEntry" ADD CONSTRAINT "RefrigerantLogEntry_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
