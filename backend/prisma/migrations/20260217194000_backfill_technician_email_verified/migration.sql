-- Bestaande technici als geverifieerd markeren (waren al actief voor deze feature)
UPDATE "Technician" SET "emailVerified" = true WHERE "emailVerified" = false;
