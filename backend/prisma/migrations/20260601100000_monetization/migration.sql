-- Monetization: platform commission, listing promotion, premium subscription

-- Extend TransactionType enum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PLATFORM_FEE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PROMOTION';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PREMIUM';

-- New enum for platform income source
DO $$ BEGIN
    CREATE TYPE "PlatformIncomeSource" AS ENUM ('COMMISSION', 'PROMOTION', 'PREMIUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Premium subscription on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premium_until" TIMESTAMP(3);

-- Promotion on Listing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promoted_until" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Listing_promoted_until_idx" ON "Listing"("promoted_until");

-- Platform income ledger
CREATE TABLE IF NOT EXISTS "PlatformIncome" (
    "id"                UUID PRIMARY KEY,
    "amount"            DECIMAL(10, 2) NOT NULL,
    "source"            "PlatformIncomeSource" NOT NULL,
    "user_id"           UUID,
    "rental_request_id" UUID,
    "listing_id"        UUID,
    "description"       TEXT,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PlatformIncome_source_idx" ON "PlatformIncome"("source");
CREATE INDEX IF NOT EXISTS "PlatformIncome_created_at_idx" ON "PlatformIncome"("created_at");
