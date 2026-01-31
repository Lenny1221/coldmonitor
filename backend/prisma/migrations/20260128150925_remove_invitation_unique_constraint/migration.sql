-- DropIndex
DROP INDEX "Invitation_technicianId_customerId_status_key";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateIndex
CREATE INDEX "Invitation_technicianId_customerId_status_idx" ON "Invitation"("technicianId", "customerId", "status");
