-- CreateEnum
CREATE TYPE "AlarmLayer" AS ENUM ('LAYER_1', 'LAYER_2', 'LAYER_3');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('OPEN_HOURS', 'AFTER_HOURS', 'NIGHT');

-- CreateEnum
CREATE TYPE "EscalationRecipient" AS ENUM ('TECHNICIAN', 'CLIENT');

-- CreateEnum
CREATE TYPE "EscalationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'PHONE');

-- AlterEnum
ALTER TYPE "AlertStatus" ADD VALUE 'ESCALATING';

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT,
ADD COLUMN     "layer" "AlarmLayer" NOT NULL DEFAULT 'LAYER_1',
ADD COLUMN     "layer2At" TIMESTAMP(3),
ADD COLUMN     "layer3At" TIMESTAMP(3),
ADD COLUMN     "timeSlot" "TimeSlot";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "backupPhone" TEXT,
ADD COLUMN     "closingTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "nightStart" TEXT NOT NULL DEFAULT '23:00',
ADD COLUMN     "openingTime" TEXT NOT NULL DEFAULT '07:00';

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateTable
CREATE TABLE "EscalationLog" (
    "id" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "layer" "AlarmLayer" NOT NULL,
    "action" TEXT NOT NULL,
    "recipientType" "EscalationRecipient" NOT NULL,
    "channel" "EscalationChannel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseAt" TIMESTAMP(3),

    CONSTRAINT "EscalationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EscalationLog_alarmId_idx" ON "EscalationLog"("alarmId");

-- CreateIndex
CREATE INDEX "EscalationLog_sentAt_idx" ON "EscalationLog"("sentAt");

-- CreateIndex
CREATE INDEX "Alert_layer_idx" ON "Alert"("layer");

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
