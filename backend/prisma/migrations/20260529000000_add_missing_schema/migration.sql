-- Add token_version and deposit_balance to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deposit_balance" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

-- Add views_count, rating_avg, reviews_count to Listing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "views_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "rating_avg" DECIMAL(3,2);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reviews_count" INTEGER NOT NULL DEFAULT 0;

-- Add qr_token and return_images to RentalRequest
ALTER TABLE "RentalRequest" ADD COLUMN IF NOT EXISTS "qr_token" TEXT;
ALTER TABLE "RentalRequest" ADD COLUMN IF NOT EXISTS "return_images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE UNIQUE INDEX IF NOT EXISTS "RentalRequest_qr_token_key" ON "RentalRequest"("qr_token");

-- Fix Review unique index (was rental_request_id only, now rental_request_id + author_id)
DROP INDEX IF EXISTS "Review_rental_request_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Review_rental_request_id_author_id_key" ON "Review"("rental_request_id", "author_id");

-- Add listing_rating to Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "listing_rating" INTEGER;

-- CreateTable RefreshToken
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" UUID NOT NULL,
    "jti" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(64) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_jti_key" ON "RefreshToken"("jti");
CREATE INDEX IF NOT EXISTS "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
CREATE INDEX IF NOT EXISTS "RefreshToken_user_id_device_id_idx" ON "RefreshToken"("user_id", "device_id");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- CreateTable PasswordResetToken
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_hash_key" ON "PasswordResetToken"("token_hash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- CreateTable Report
CREATE TABLE IF NOT EXISTS "Report" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;
