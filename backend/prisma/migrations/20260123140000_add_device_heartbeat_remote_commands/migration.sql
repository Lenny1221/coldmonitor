-- CreateEnum
CREATE TYPE "RemoteCommandType" AS ENUM ('RESTART', 'WIFI_SCAN', 'WIFI_CONNECT', 'FIRMWARE_UPDATE');

-- CreateEnum
CREATE TYPE "RemoteCommandStatus" AS ENUM ('PENDING', 'SENT', 'EXECUTED', 'FAILED');

-- CreateTable
CREATE TABLE "DeviceHeartbeat" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "wifiSsid" TEXT,
    "wifiRssi" INTEGER,
    "uptimeSeconds" INTEGER NOT NULL,
    "freeHeap" INTEGER NOT NULL,
    "batteryPercent" INTEGER,
    "onMains" BOOLEAN,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceRemoteCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "command" "RemoteCommandType" NOT NULL,
    "payload" JSONB,
    "status" "RemoteCommandStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceRemoteCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceHeartbeat_deviceId_idx" ON "DeviceHeartbeat"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceHeartbeat_createdAt_idx" ON "DeviceHeartbeat"("createdAt");

-- CreateIndex
CREATE INDEX "DeviceRemoteCommand_deviceId_status_idx" ON "DeviceRemoteCommand"("deviceId", "status");

-- CreateIndex
CREATE INDEX "DeviceRemoteCommand_status_idx" ON "DeviceRemoteCommand"("status");

-- AddForeignKey
ALTER TABLE "DeviceHeartbeat" ADD CONSTRAINT "DeviceHeartbeat_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRemoteCommand" ADD CONSTRAINT "DeviceRemoteCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
