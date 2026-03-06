-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "nextEpbdDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
