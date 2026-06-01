-- Listing visibility toggle
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "hidden_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Listing_is_hidden_idx" ON "Listing"("is_hidden");

-- Disputes
DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED_FOR_RENTER', 'RESOLVED_FOR_OWNER', 'RESOLVED_SPLIT', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" UUID PRIMARY KEY,
    "rental_request_id" UUID NOT NULL UNIQUE,
    "opened_by_id" UUID NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "renter_evidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "owner_evidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "admin_note" TEXT,
    "deposit_to_renter" DECIMAL(10, 2),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dispute_rental_request_id_fkey" FOREIGN KEY ("rental_request_id") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Dispute_status_idx" ON "Dispute"("status");

-- User blocks
CREATE TABLE IF NOT EXISTS "UserBlock" (
    "id" UUID PRIMARY KEY,
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBlock_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blocker_id_blocked_id_key" ON "UserBlock"("blocker_id", "blocked_id");
CREATE INDEX IF NOT EXISTS "UserBlock_blocker_id_idx" ON "UserBlock"("blocker_id");
CREATE INDEX IF NOT EXISTS "UserBlock_blocked_id_idx" ON "UserBlock"("blocked_id");
