-- Make password_hash nullable for OAuth-only users
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add OAuth provider columns
ALTER TABLE "User" ADD COLUMN "provider" VARCHAR(32) NOT NULL DEFAULT 'local';
ALTER TABLE "User" ADD COLUMN "google_id" VARCHAR(255);

-- Unique index for google_id so we can look up users by it
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");
