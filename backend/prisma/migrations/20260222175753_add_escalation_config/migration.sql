-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "escalationConfig" JSONB;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
