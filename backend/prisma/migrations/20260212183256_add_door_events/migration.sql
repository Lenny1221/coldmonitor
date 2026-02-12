-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- CreateTable
CREATE TABLE "DeviceState" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "doorState" TEXT NOT NULL,
    "doorLastChangedAt" TIMESTAMP(3) NOT NULL,
    "doorOpenCountTotal" INTEGER NOT NULL DEFAULT 0,
    "doorCloseCountTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "seq" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorStatsDaily" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "closes" INTEGER NOT NULL DEFAULT 0,
    "totalOpenSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DoorStatsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceState_deviceId_key" ON "DeviceState"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceState_deviceId_idx" ON "DeviceState"("deviceId");

-- CreateIndex
CREATE INDEX "DoorEvent_deviceId_idx" ON "DoorEvent"("deviceId");

-- CreateIndex
CREATE INDEX "DoorEvent_deviceId_timestamp_idx" ON "DoorEvent"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "DoorEvent_timestamp_idx" ON "DoorEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DoorEvent_deviceId_seq_key" ON "DoorEvent"("deviceId", "seq");

-- CreateIndex
CREATE INDEX "DoorStatsDaily_deviceId_idx" ON "DoorStatsDaily"("deviceId");

-- CreateIndex
CREATE INDEX "DoorStatsDaily_date_idx" ON "DoorStatsDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DoorStatsDaily_deviceId_date_key" ON "DoorStatsDaily"("deviceId", "date");

-- AddForeignKey
ALTER TABLE "DeviceState" ADD CONSTRAINT "DeviceState_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorEvent" ADD CONSTRAINT "DoorEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorStatsDaily" ADD CONSTRAINT "DoorStatsDaily_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
