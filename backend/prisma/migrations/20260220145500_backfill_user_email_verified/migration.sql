-- Backfill User.emailVerified based on Customer and Technician
UPDATE "User" u
SET "emailVerified" = true
WHERE u.id IN (
  SELECT "userId" FROM "Customer" WHERE "emailVerified" = true
  UNION
  SELECT "userId" FROM "Technician" WHERE "emailVerified" = true
);
