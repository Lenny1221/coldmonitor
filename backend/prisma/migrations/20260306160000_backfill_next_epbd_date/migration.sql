-- Backfill nextEpbdDate voor bestaande airco's > 70 kW (EPBD)
UPDATE "Installation"
SET "nextEpbdDate" = COALESCE("firstUseDate", "createdAt") + INTERVAL '60 months'
WHERE type = 'AIRCO' AND "nominalCoolingKw" > 70 AND "nextEpbdDate" IS NULL;
