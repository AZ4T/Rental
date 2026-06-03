-- Tier of the active promotion (null when not promoted).
ALTER TABLE "Listing" ADD COLUMN "promotion_tier" VARCHAR(16);
