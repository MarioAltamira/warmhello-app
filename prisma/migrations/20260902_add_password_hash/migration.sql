-- Add nullable password_hash column to Subscriber table (backwards compatible, no data loss)
-- Legacy rows (created before passwords feature) have NULL; UI guides them to set first password via forgot flow / Settings card
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255);
