-- Add QStash job message id tracking columns to CheckIn
-- Idempotent; safe to rerun if columns already exist
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "firstJobMessageId" TEXT;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "reminderJobMessageId" TEXT;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "escalationJobMessageId" TEXT;
