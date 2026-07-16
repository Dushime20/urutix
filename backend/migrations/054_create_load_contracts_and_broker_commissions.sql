-- =============================================================================
-- Migration 054: Create load_contracts + broker_commissions
-- =============================================================================
-- ROOT CAUSE
-- ----------
-- TypeORM entities LoadContract / BrokerCommission map to these tables, but
-- production only runs backend/migrations/*.sql via migrate.js. The CREATE DDL
-- lived only in unused TypeORM TS migrations (173800*/173810*), so broker
-- endpoints fail with:
--   relation "load_contracts" does not exist
--   relation "broker_commissions" does not exist
--
-- Affects: GET /api/brokers/contracts, /commissions, /statistics
--
-- SAFE / IDEMPOTENT: CREATE TYPE/TABLE IF NOT EXISTS, guarded FKs, enum ADD VALUE.
-- Matches current entity nullability and status enums (incl. PENDING_BROKER_ACCEPTANCE, REJECTED).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_contracttype_enum') THEN
    CREATE TYPE "public"."load_contracts_contracttype_enum" AS ENUM(
      'LOAD_AGREEMENT', 'TRANSPORT_AGREEMENT', 'BROKER_AGREEMENT'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_status_enum') THEN
    CREATE TYPE "public"."load_contracts_status_enum" AS ENUM(
      'DRAFT',
      'PENDING_SIGNATURE',
      'PENDING_BROKER_ACCEPTANCE',
      'PARTIALLY_SIGNED',
      'SIGNED',
      'ACTIVE',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
      'REJECTED'
    );
  END IF;
END $$;

-- If an older enum exists without newer values, extend it safely
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_status_enum') THEN
    ALTER TYPE "public"."load_contracts_status_enum" ADD VALUE IF NOT EXISTS 'PENDING_BROKER_ACCEPTANCE';
    ALTER TYPE "public"."load_contracts_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
  END IF;
END $$;

-- Legacy name from hand-written TS migration — ensure new values if that type exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_contractstatus_enum') THEN
    ALTER TYPE "public"."load_contracts_contractstatus_enum" ADD VALUE IF NOT EXISTS 'PENDING_BROKER_ACCEPTANCE';
    ALTER TYPE "public"."load_contracts_contractstatus_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_commissions_status_enum') THEN
    CREATE TYPE "public"."broker_commissions_status_enum" AS ENUM(
      'PENDING', 'APPROVED', 'PAID', 'CANCELLED'
    );
  END IF;
END $$;

-- ==================== LOAD CONTRACTS ====================

CREATE TABLE IF NOT EXISTS "load_contracts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid,
  "loadId" uuid,
  "tripId" uuid,
  "cargoOwnerId" uuid,
  "transporterId" uuid,
  "contractType" "public"."load_contracts_contracttype_enum" NOT NULL DEFAULT 'LOAD_AGREEMENT',
  "status" "public"."load_contracts_status_enum" NOT NULL DEFAULT 'DRAFT',
  "agreedRate" numeric(15,2),
  "currencyCode" character varying(3) NOT NULL DEFAULT 'KES',
  "commissionRate" numeric(5,2),
  "commissionAmount" numeric(15,2),
  "paymentTerms" text,
  "paymentDueDate" date,
  "pickupDate" date,
  "deliveryDate" date,
  "deliveryTerms" text,
  "specialInstructions" text,
  "contractContent" text,
  "contractData" jsonb DEFAULT '{}',
  "cargoOwnerSignature" jsonb,
  "transporterSignature" jsonb,
  "brokerSignature" jsonb,
  "fullySignedAt" date,
  "negotiationHistory" jsonb DEFAULT '[]',
  "expiresAt" date,
  "isTemplate" boolean DEFAULT false,
  "templateId" uuid,
  "metadata" jsonb DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_load_contracts" PRIMARY KEY ("id")
);

-- Idempotent column adds for partially-created / older schemas
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "brokerId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "loadId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "tripId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "cargoOwnerId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "transporterId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "paymentTerms" text;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "paymentDueDate" date;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "pickupDate" date;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "deliveryDate" date;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "deliveryTerms" text;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "specialInstructions" text;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "contractContent" text;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "contractData" jsonb DEFAULT '{}';
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "cargoOwnerSignature" jsonb;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "transporterSignature" jsonb;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "brokerSignature" jsonb;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "fullySignedAt" date;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "negotiationHistory" jsonb DEFAULT '[]';
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "expiresAt" date;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "isTemplate" boolean DEFAULT false;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "templateId" uuid;
ALTER TABLE "load_contracts" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "IDX_load_contracts_load_status" ON "load_contracts" ("loadId", "status");
CREATE INDEX IF NOT EXISTS "IDX_load_contracts_broker_status" ON "load_contracts" ("brokerId", "status");
CREATE INDEX IF NOT EXISTS "IDX_load_contracts_tenant_created" ON "load_contracts" ("tenantId", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_broker')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_broker"
      FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_cargo_owner')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_cargo_owner"
      FOREIGN KEY ("cargoOwnerId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_transporter')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_transporter"
      FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_load')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loads') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_load"
      FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_trip')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_trip"
      FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_load_contracts_tenant')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    ALTER TABLE "load_contracts"
      ADD CONSTRAINT "FK_load_contracts_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ==================== BROKER COMMISSIONS ====================

CREATE TABLE IF NOT EXISTS "broker_commissions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid NOT NULL,
  "loadId" uuid NOT NULL,
  "tripId" uuid,
  "loadAmount" numeric(15,2) NOT NULL,
  "commissionRate" numeric(5,2) NOT NULL,
  "commissionAmount" numeric(15,2) NOT NULL,
  "status" "public"."broker_commissions_status_enum" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP,
  "paymentReference" character varying,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_commissions" PRIMARY KEY ("id")
);

ALTER TABLE "broker_commissions" ADD COLUMN IF NOT EXISTS "tripId" uuid;
ALTER TABLE "broker_commissions" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP;
ALTER TABLE "broker_commissions" ADD COLUMN IF NOT EXISTS "paymentReference" character varying;
ALTER TABLE "broker_commissions" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_broker_status" ON "broker_commissions" ("brokerId", "status");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_load" ON "broker_commissions" ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_tenant_created" ON "broker_commissions" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_status_created" ON "broker_commissions" ("status", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_broker_commissions_broker')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_broker"
      FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_broker_commissions_load')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loads') THEN
    ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_load"
      FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_broker_commissions_tenant')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_broker_commissions_trip')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
    ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_trip"
      FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON TABLE "load_contracts" IS 'Broker load/transport agreements with signature and negotiation tracking';
COMMENT ON TABLE "broker_commissions" IS 'Broker commission records per load/trip';
