-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- AlterTable
ALTER TABLE "Technician" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT;

-- CreateIndex
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
