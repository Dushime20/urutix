-- Broker Critical Features Migration
-- Created: 2026-01-13
-- Description: Creates tables for broker disputes, escrow accounts, insurance verifications, contracts, and documents

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== BROKER DISPUTES ====================

-- Create dispute category enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputecategory_enum') THEN
    CREATE TYPE "public"."broker_disputes_disputecategory_enum" AS ENUM('DAMAGE', 'DELAY', 'PAYMENT', 'QUALITY', 'ROUTE', 'COMMUNICATION', 'OTHER');
  END IF;
END $$;

-- Create dispute status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputestatus_enum') THEN
    CREATE TYPE "public"."broker_disputes_disputestatus_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'CLOSED', 'ESCALATED');
  END IF;
END $$;

-- Create dispute severity enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputeseverity_enum') THEN
    CREATE TYPE "public"."broker_disputes_disputeseverity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END $$;

-- Create broker_disputes table
CREATE TABLE IF NOT EXISTS "broker_disputes" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid NOT NULL,
  "loadId" uuid NOT NULL,
  "tripId" uuid,
  "raisedById" uuid NOT NULL,
  "disputedWithId" uuid NOT NULL,
  "category" "public"."broker_disputes_disputecategory_enum" NOT NULL,
  "status" "public"."broker_disputes_disputestatus_enum" NOT NULL DEFAULT 'OPEN',
  "severity" "public"."broker_disputes_disputeseverity_enum" NOT NULL DEFAULT 'MEDIUM',
  "description" text NOT NULL,
  "resolution" text,
  "claimedAmount" numeric(15,2),
  "resolvedAmount" numeric(15,2),
  "evidence" jsonb NOT NULL DEFAULT '[]',
  "mediatorId" uuid,
  "mediationHistory" jsonb NOT NULL DEFAULT '[]',
  "communications" jsonb NOT NULL DEFAULT '[]',
  "resolvedAt" date,
  "resolvedBy" uuid,
  "resolutionNotes" text,
  "resolutionTerms" jsonb,
  "escalatedAt" date,
  "closedAt" date,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_disputes" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "IDX_broker_disputes_broker_status" ON "broker_disputes" ("brokerId", "status");
CREATE INDEX IF NOT EXISTS "IDX_broker_disputes_load_status" ON "broker_disputes" ("loadId", "status");
CREATE INDEX IF NOT EXISTS "IDX_broker_disputes_trip_status" ON "broker_disputes" ("tripId", "status");
CREATE INDEX IF NOT EXISTS "IDX_broker_disputes_tenant_created" ON "broker_disputes" ("tenantId", "createdAt");

-- Add foreign keys
ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_broker"
FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_raised_by"
FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_disputed_with"
FOREIGN KEY ("disputedWithId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_mediator"
FOREIGN KEY ("mediatorId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_load"
FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_trip"
FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;

ALTER TABLE "broker_disputes"
ADD CONSTRAINT "FK_broker_disputes_tenant"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- ==================== ESCROW ACCOUNTS ====================

-- Create escrow status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_accounts_escrowstatus_enum') THEN
    CREATE TYPE "public"."escrow_accounts_escrowstatus_enum" AS ENUM('PENDING', 'FUNDED', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
  END IF;
END $$;

-- Create release trigger enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_accounts_releasetrigger_enum') THEN
    CREATE TYPE "public"."escrow_accounts_releasetrigger_enum" AS ENUM('DELIVERY_CONFIRMED', 'MILESTONE_REACHED', 'MANUAL', 'DISPUTE_RESOLVED', 'TIME_BASED');
  END IF;
END $$;

-- Create escrow_accounts table
CREATE TABLE IF NOT EXISTS "escrow_accounts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid NOT NULL,
  "loadId" uuid NOT NULL,
  "tripId" uuid,
  "payerId" uuid NOT NULL,
  "payeeId" uuid NOT NULL,
  "status" "public"."escrow_accounts_escrowstatus_enum" NOT NULL DEFAULT 'PENDING',
  "totalAmount" numeric(15,2) NOT NULL,
  "currencyCode" character varying(3) NOT NULL DEFAULT 'KES',
  "fundedAmount" numeric(15,2) NOT NULL DEFAULT 0,
  "releasedAmount" numeric(15,2) NOT NULL DEFAULT 0,
  "commissionAmount" numeric(15,2) NOT NULL DEFAULT 0,
  "paymentMethod" character varying,
  "paymentReference" character varying,
  "transactionId" character varying,
  "fundedAt" date,
  "releaseSchedule" jsonb NOT NULL DEFAULT '[]',
  "autoReleaseConfig" jsonb,
  "releaseHistory" jsonb NOT NULL DEFAULT '[]',
  "disputeId" uuid,
  "isDisputed" boolean NOT NULL DEFAULT false,
  "disputedAt" date,
  "refundedAmount" numeric(15,2) NOT NULL DEFAULT 0,
  "refundHistory" jsonb NOT NULL DEFAULT '[]',
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_escrow_accounts" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "IDX_escrow_accounts_load_status" ON "escrow_accounts" ("loadId", "status");
CREATE INDEX IF NOT EXISTS "IDX_escrow_accounts_trip_status" ON "escrow_accounts" ("tripId", "status");
CREATE INDEX IF NOT EXISTS "IDX_escrow_accounts_tenant_created" ON "escrow_accounts" ("tenantId", "createdAt");

-- Add foreign keys
ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_broker"
FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_payer"
FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_payee"
FOREIGN KEY ("payeeId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_load"
FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;

ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_trip"
FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;

ALTER TABLE "escrow_accounts"
ADD CONSTRAINT "FK_escrow_accounts_tenant"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- ==================== INSURANCE VERIFICATIONS ====================

-- Create verification type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_verifications_verificationtype_enum') THEN
    CREATE TYPE "public"."insurance_verifications_verificationtype_enum" AS ENUM('INSURANCE', 'LICENSE', 'DOT_NUMBER', 'MC_NUMBER', 'CARGO_INSURANCE', 'BOND');
  END IF;
END $$;

-- Create verification status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_verifications_verificationstatus_enum') THEN
    CREATE TYPE "public"."insurance_verifications_verificationstatus_enum" AS ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'INVALID', 'REQUIRES_UPDATE');
  END IF;
END $$;

-- Create insurance_verifications table
CREATE TABLE IF NOT EXISTS "insurance_verifications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid NOT NULL,
  "transporterId" uuid NOT NULL,
  "loadId" uuid,
  "verificationType" "public"."insurance_verifications_verificationtype_enum" NOT NULL,
  "status" "public"."insurance_verifications_verificationstatus_enum" NOT NULL DEFAULT 'PENDING',
  "policyNumber" character varying,
  "licenseNumber" character varying,
  "dotNumber" character varying,
  "mcNumber" character varying,
  "insuranceCompany" character varying,
  "coverageAmount" numeric(15,2),
  "effectiveDate" date,
  "expiryDate" date,
  "verifiedAt" date,
  "verifiedBy" uuid,
  "verificationNotes" text,
  "verificationData" jsonb,
  "rejectionReason" text,
  "isAutomated" boolean NOT NULL DEFAULT false,
  "lastCheckedAt" date,
  "nextCheckDate" date,
  "expiryAlertSent" boolean NOT NULL DEFAULT false,
  "expiryAlertSentAt" date,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_insurance_verifications" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "IDX_insurance_verifications_transporter_status" ON "insurance_verifications" ("transporterId", "status");
CREATE INDEX IF NOT EXISTS "IDX_insurance_verifications_load_type" ON "insurance_verifications" ("loadId", "verificationType");
CREATE INDEX IF NOT EXISTS "IDX_insurance_verifications_tenant_created" ON "insurance_verifications" ("tenantId", "createdAt");

-- Add foreign keys
ALTER TABLE "insurance_verifications"
ADD CONSTRAINT "FK_insurance_verifications_broker"
FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "insurance_verifications"
ADD CONSTRAINT "FK_insurance_verifications_transporter"
FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "insurance_verifications"
ADD CONSTRAINT "FK_insurance_verifications_load"
FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE SET NULL;

ALTER TABLE "insurance_verifications"
ADD CONSTRAINT "FK_insurance_verifications_tenant"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

COMMENT ON TABLE broker_disputes IS 'Manages disputes between brokers, cargo owners, and transporters';
COMMENT ON TABLE escrow_accounts IS 'Handles escrow payments for loads with automatic and manual release triggers';
COMMENT ON TABLE insurance_verifications IS 'Tracks insurance and compliance verification for transporters';
