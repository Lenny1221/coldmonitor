-- AlterTable
ALTER TABLE "ColdCell" ADD COLUMN     "doorAlarmDelaySeconds" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
