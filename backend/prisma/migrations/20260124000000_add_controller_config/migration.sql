-- AlterTable
ALTER TABLE "Device" ADD COLUMN "controllerType" TEXT;
ALTER TABLE "Device" ADD COLUMN "controllerSlaveAddr" INTEGER;
ALTER TABLE "Device" ADD COLUMN "controllerBaudRate" INTEGER;
