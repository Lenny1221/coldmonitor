-- AlterTable
ALTER TABLE "ColdCellAnomalyState" ADD COLUMN "lastFindingNotifiedAt" TIMESTAMP(3);
ALTER TABLE "ColdCellAnomalyState" ADD COLUMN "lastFindingSignature" TEXT;
