-- CreateEnum
CREATE TYPE "InstallationType" AS ENUM ('KOELINSTALLATIE', 'AIRCO', 'WARMTEPOMP', 'VRIESINSTALLATIE');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('ACTIEF', 'IN_ONDERHOUD', 'BUITEN_WERKING');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('ONDERHOUDSAANVRAAG', 'STORINGSMELDING', 'VRAAG_OPMERKING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NIEUW', 'IN_BEHANDELING', 'INGEPLAND', 'AFGEROND', 'GESLOTEN');

-- CreateEnum
CREATE TYPE "TicketUrgency" AS ENUM ('LAAG', 'NORMAAL', 'DRINGEND');

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateTable
CREATE TABLE "InstallationTechnician" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationTechnician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstallationType" NOT NULL,
    "refrigerantType" TEXT NOT NULL,
    "refrigerantKg" DOUBLE PRECISION NOT NULL,
    "co2EquivalentTon" DOUBLE PRECISION,
    "nominalCoolingKw" DOUBLE PRECISION,
    "hasLeakDetection" BOOLEAN NOT NULL DEFAULT false,
    "firstUseDate" TIMESTAMP(3),
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIEF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "technicianId" TEXT,
    "technicianName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GEPLAND',
    "confirmationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installationId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checklist" JSONB,
    "notes" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "urgency" "TicketUrgency" NOT NULL DEFAULT 'NORMAAL',
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NIEUW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "installationId" TEXT,
    "assignedTechnicianId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTimeSlot" (
    "id" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "preference" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "TicketTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketStatusLog" (
    "id" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "TicketStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceReminder" (
    "id" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduleId" TEXT,
    "installationId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstallationTechnician_technicianId_idx" ON "InstallationTechnician"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationTechnician_installationId_technicianId_key" ON "InstallationTechnician"("installationId", "technicianId");

-- CreateIndex
CREATE INDEX "Installation_customerId_idx" ON "Installation"("customerId");

-- CreateIndex
CREATE INDEX "Installation_status_idx" ON "Installation"("status");

-- CreateIndex
CREATE INDEX "Installation_nextMaintenanceDate_idx" ON "Installation"("nextMaintenanceDate");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_installationId_idx" ON "MaintenanceSchedule"("installationId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_scheduledAt_idx" ON "MaintenanceSchedule"("scheduledAt");

-- CreateIndex
CREATE INDEX "MaintenanceReport_installationId_idx" ON "MaintenanceReport"("installationId");

-- CreateIndex
CREATE INDEX "MaintenanceReport_reportDate_idx" ON "MaintenanceReport"("reportDate");

-- CreateIndex
CREATE INDEX "Ticket_customerId_idx" ON "Ticket"("customerId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketTimeSlot_ticketId_idx" ON "TicketTimeSlot"("ticketId");

-- CreateIndex
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "TicketStatusLog_ticketId_idx" ON "TicketStatusLog"("ticketId");

-- CreateIndex
CREATE INDEX "MaintenanceReminder_installationId_idx" ON "MaintenanceReminder"("installationId");

-- AddForeignKey
ALTER TABLE "InstallationTechnician" ADD CONSTRAINT "InstallationTechnician_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationTechnician" ADD CONSTRAINT "InstallationTechnician_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceReport" ADD CONSTRAINT "MaintenanceReport_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTimeSlot" ADD CONSTRAINT "TicketTimeSlot_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketStatusLog" ADD CONSTRAINT "TicketStatusLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceReminder" ADD CONSTRAINT "MaintenanceReminder_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
