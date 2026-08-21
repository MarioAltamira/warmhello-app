-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "tosAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN     "tosVersion" TEXT DEFAULT 'v2026-08-21';
ALTER TABLE "Subscriber" ADD COLUMN     "caregiverSeniorConsentAckAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN     "dashboardDisclaimerDismissedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Senior" ADD COLUMN     "caregiverConsentAckAt" TIMESTAMP(3);
ALTER TABLE "Senior" ADD COLUMN     "smsOptedOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Senior" ADD COLUMN     "smsOptedOutAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SmsConsentTombstone" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "optInAt" TIMESTAMP(3),
    "optOutAt" TIMESTAMP(3),
    "reOptInAt" TIMESTAMP(3)[],
    "reason" TEXT,
    "retainedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsConsentTombstone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsConsentTombstone_phoneE164_key" ON "SmsConsentTombstone"("phoneE164");

-- CreateIndex
CREATE INDEX "SmsConsentTombstone_phoneE164_idx" ON "SmsConsentTombstone"("phoneE164");

-- CreateIndex
CREATE INDEX "SmsConsentTombstone_retainedUntil_idx" ON "SmsConsentTombstone"("retainedUntil");
