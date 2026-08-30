-- Create enum for security audit event kinds
CREATE TYPE "SecurityAuditKind" AS ENUM (
  'MAGIC_LINK_REQUESTED',
  'MAGIC_LINK_SENT',
  'MAGIC_LINK_COMPLETED',
  'MAGIC_LINK_FAILED_NO_SUBSCRIBER',
  'MAGIC_LINK_INVALID_TOKEN',
  'MAGIC_LINK_EXPIRED',
  'MAGIC_LINK_REUSE_ATTEMPT',
  'SESSION_LOGIN_EMAIL_ONLY',
  'SESSION_LOGIN_MAGIC_LINK',
  'SESSION_LOGOUT',
  'ACCOUNT_DELETION_REQUESTED',
  'ACCOUNT_DELETION_COMPLETED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'PASSWORD_RESET_FAILED',
  'SUBSCRIBER_UPDATE_FAILED_DUPLICATE'
);

-- Add subscriber magic-link nonce columns (single-use token rotation)
ALTER TABLE "Subscriber" ADD COLUMN "magicLinkNonce" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN "magicLinkNonceRotatedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Subscriber_magicLinkNonce_key" ON "Subscriber"("magicLinkNonce");

-- Create security audit log table
CREATE TABLE "SecurityAudit" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT,
    "kind" "SecurityAuditKind" NOT NULL,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "tokenJti" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "magicLinkNonce" TEXT,
    "redirectTarget" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SecurityAudit" ADD CONSTRAINT "SecurityAudit_subscriberId_fkey"
  FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SecurityAudit_subscriberId_createdAt_idx"
  ON "SecurityAudit"("subscriberId", "createdAt");
CREATE INDEX "SecurityAudit_kind_createdAt_idx"
  ON "SecurityAudit"("kind", "createdAt");
CREATE INDEX "SecurityAudit_email_createdAt_idx"
  ON "SecurityAudit"("email", "createdAt");
CREATE INDEX "SecurityAudit_createdAt_idx"
  ON "SecurityAudit"("createdAt");
CREATE INDEX "SecurityAudit_tokenJti_idx"
  ON "SecurityAudit"("tokenJti");
