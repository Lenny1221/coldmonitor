-- Zelflerende anomaliedetectie (FASE 1)

CREATE TYPE "AnomalyBaselineMode" AS ENUM ('LEARNING', 'ACTIVE');

CREATE TYPE "MeasurementContextType" AS ENUM ('COMPRESSOR_ON', 'COMPRESSOR_OFF', 'POST_DEFROST', 'DOOR_OPEN');

CREATE TABLE "ColdCellAnomalyState" (
    "coldCellId" TEXT NOT NULL,
    "baselineMode" "AnomalyBaselineMode" NOT NULL DEFAULT 'LEARNING',
    "firstReadingAt" TIMESTAMP(3),
    "readingCount" INTEGER NOT NULL DEFAULT 0,
    "lastProcessedAt" TIMESTAMP(3),
    "compressorInferredOn" BOOLEAN NOT NULL DEFAULT false,
    "compressorOnSince" TIMESTAMP(3),
    "defrostActive" BOOLEAN NOT NULL DEFAULT false,
    "defrostStartedAt" TIMESTAMP(3),
    "postDefrostUntil" TIMESTAMP(3),
    "doorOpenSince" TIMESTAMP(3),
    "pullDownStartedAt" TIMESTAMP(3),
    "lastEvaporatorTemp" FLOAT,
    "lastEvaporatorAt" TIMESTAMP(3),
    "lastRoomTemp" FLOAT,
    "activeFindings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdCellAnomalyState_pkey" PRIMARY KEY ("coldCellId")
);

CREATE TABLE "ColdCellContextBaseline" (
    "id" TEXT NOT NULL,
    "coldCellId" TEXT NOT NULL,
    "context" "MeasurementContextType" NOT NULL,
    "ewmaDeltaT" DOUBLE PRECISION,
    "ewmaDeltaTSq" DOUBLE PRECISION,
    "ewmaPullDownMin" DOUBLE PRECISION,
    "ewmaEvapFloor" DOUBLE PRECISION,
    "longTermDeltaT" DOUBLE PRECISION,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdCellContextBaseline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ColdCellContextBaseline_coldCellId_context_key" ON "ColdCellContextBaseline"("coldCellId", "context");

CREATE INDEX "ColdCellContextBaseline_coldCellId_idx" ON "ColdCellContextBaseline"("coldCellId");

ALTER TABLE "ColdCellAnomalyState" ADD CONSTRAINT "ColdCellAnomalyState_coldCellId_fkey" FOREIGN KEY ("coldCellId") REFERENCES "ColdCell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ColdCellContextBaseline" ADD CONSTRAINT "ColdCellContextBaseline_coldCellId_fkey" FOREIGN KEY ("coldCellId") REFERENCES "ColdCell"("id") ON DELETE CASCADE ON UPDATE CASCADE;
