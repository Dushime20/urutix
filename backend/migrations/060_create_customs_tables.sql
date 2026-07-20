-- Migration: 060_create_customs_tables
-- Description: Create customs_inspections, customs_compliance_responses, and
--              customs_checkpoints tables required by the customs module.
--              Safe to run multiple times (idempotent).
--
-- Root cause:
--   GET /api/customs/my-inspections → QueryFailedError:
--   relation "customs_inspections" does not exist
--
-- Why:
--   These tables were defined in a TypeORM migration (AddCurrencyTables) but
--   production uses migrate.js which only runs backend/migrations/*.sql files.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. customs_inspections enums ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."customs_inspections_status_enum" AS ENUM(
    'PENDING', 'IN_PROGRESS', 'CLEARED', 'REJECTED', 'ON_HOLD', 'HIGH_RISK'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."customs_inspections_risklevel_enum" AS ENUM(
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."customs_inspections_inspectionchannel_enum" AS ENUM(
    'GREEN', 'YELLOW', 'RED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."customs_inspections_examtype_enum" AS ENUM(
    'NONE', 'DOCUMENT', 'X_RAY', 'TAILGATE', 'INTENSIVE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."customs_inspections_holdtype_enum" AS ENUM(
    'NONE', 'MANIFEST', 'STATISTICAL', 'COMMERCIAL_ENFORCEMENT',
    'ANTI_TERRORISM', 'AGENCY', 'SANCTIONS', 'DANGEROUS_GOODS', 'DUTY_ARREARS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. customs_inspections table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "customs_inspections" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "officerId" uuid NOT NULL,
  "tripId" uuid,
  "plateNumber" character varying,
  "containerNumber" character varying,
  "shipmentReference" character varying,
  "driverName" character varying,
  "driverId" character varying,
  "truckType" character varying,
  "originCountry" character varying,
  "destinationCountry" character varying,
  "cargoType" character varying,
  "cargoCategory" character varying,
  "declaredWeight" numeric(10,2),
  "actualWeight" numeric(10,2),
  "declaredQuantity" integer,
  "actualQuantity" integer,
  "hsCode" character varying,
  "sealNumber" character varying,
  "shippingCompany" character varying,
  "declarationNumber" character varying,
  "countryOfOrigin" character varying,
  "modeOfTransport" character varying,
  "imdgClass" character varying,
  "unNumber" character varying,
  "declaredValue" numeric(15,2),
  "currency" character varying DEFAULT 'USD',
  "dutyAmount" numeric(15,2),
  "taxAmount" numeric(15,2),
  "aeoNumber" character varying,
  "deniedPartyFlag" boolean NOT NULL DEFAULT false,
  "sanctionsScreened" boolean NOT NULL DEFAULT false,
  "hasDangerousGoods" boolean NOT NULL DEFAULT false,
  "isRestrictedGoods" boolean NOT NULL DEFAULT false,
  "status" "public"."customs_inspections_status_enum" NOT NULL DEFAULT 'PENDING',
  "riskLevel" "public"."customs_inspections_risklevel_enum" NOT NULL DEFAULT 'LOW',
  "inspectionChannel" "public"."customs_inspections_inspectionchannel_enum",
  "examType" "public"."customs_inspections_examtype_enum" NOT NULL DEFAULT 'NONE',
  "holdType" "public"."customs_inspections_holdtype_enum" NOT NULL DEFAULT 'NONE',
  "estimatedReleaseAt" TIMESTAMP,
  "checkpointId" character varying,
  "checkpointName" character varying,
  "inspectionNotes" text,
  "rejectionReason" text,
  "documentsVerified" jsonb,
  "evidenceUrls" text,
  "metadata" jsonb,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_8984f033fd191ef7912eb5de09e" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_536dc50e6fb907218efee3f223"
  ON "customs_inspections" ("createdAt");

CREATE INDEX IF NOT EXISTS "IDX_02cd4dc58d3e19f91e5c76f588"
  ON "customs_inspections" ("shipmentReference");

CREATE INDEX IF NOT EXISTS "IDX_13fc32060c7bb57af14bedebb8"
  ON "customs_inspections" ("plateNumber");

CREATE INDEX IF NOT EXISTS "IDX_0e96a836c8168d21369bf49d17"
  ON "customs_inspections" ("tenantId", "officerId");

CREATE INDEX IF NOT EXISTS "IDX_e1677825b2bc4a6d8e579b9e53"
  ON "customs_inspections" ("tenantId", "status");

-- ── 3. customs_compliance_responses ──────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."customs_compliance_responses_status_enum" AS ENUM(
    'SUBMITTED', 'REVIEWED', 'ACCEPTED', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "customs_compliance_responses" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "inspectionId" uuid NOT NULL,
  "submittedById" uuid NOT NULL,
  "notes" text NOT NULL,
  "documentIds" jsonb NOT NULL DEFAULT '[]',
  "status" "public"."customs_compliance_responses_status_enum" NOT NULL DEFAULT 'SUBMITTED',
  "reviewedById" uuid,
  "reviewNotes" text,
  "reviewedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_c4192488a0fbd7b3974beb16514" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_40d2ede4cf9edc8fd065c89d49"
  ON "customs_compliance_responses" ("status");

CREATE INDEX IF NOT EXISTS "IDX_6763bfee5af4c2fdfc1e86f303"
  ON "customs_compliance_responses" ("submittedById");

CREATE INDEX IF NOT EXISTS "IDX_f93160727f0dc81c051fa139fd"
  ON "customs_compliance_responses" ("inspectionId");

-- ── 4. customs_checkpoints ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."customs_checkpoints_type_enum" AS ENUM(
    'BORDER', 'PORT', 'WAREHOUSE', 'INLAND', 'AIRPORT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "customs_checkpoints" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "name" character varying NOT NULL,
  "code" character varying,
  "type" "public"."customs_checkpoints_type_enum" NOT NULL DEFAULT 'BORDER',
  "country" character varying,
  "city" character varying,
  "address" character varying,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "isActive" boolean NOT NULL DEFAULT true,
  "metadata" jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_2ba759370e402dfcc5a04c398eb" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_a112819bd3e30e139f6fb175f0"
  ON "customs_checkpoints" ("isActive");

CREATE INDEX IF NOT EXISTS "IDX_2f1f1bdb5046fa5c43cbfeb23b"
  ON "customs_checkpoints" ("tenantId");

-- ── 5. Foreign keys ──────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_618b2c89f808b69f5c72b3e3532'
      AND table_name = 'customs_inspections'
  ) THEN
    ALTER TABLE "customs_inspections"
      ADD CONSTRAINT "FK_618b2c89f808b69f5c72b3e3532"
      FOREIGN KEY ("officerId") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_5d770b77534b211435dc540cf0b'
      AND table_name = 'customs_inspections'
  ) THEN
    ALTER TABLE "customs_inspections"
      ADD CONSTRAINT "FK_5d770b77534b211435dc540cf0b"
      FOREIGN KEY ("tripId") REFERENCES "trips"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_f93160727f0dc81c051fa139fd9'
      AND table_name = 'customs_compliance_responses'
  ) THEN
    ALTER TABLE "customs_compliance_responses"
      ADD CONSTRAINT "FK_f93160727f0dc81c051fa139fd9"
      FOREIGN KEY ("inspectionId") REFERENCES "customs_inspections"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_6763bfee5af4c2fdfc1e86f303a'
      AND table_name = 'customs_compliance_responses'
  ) THEN
    ALTER TABLE "customs_compliance_responses"
      ADD CONSTRAINT "FK_6763bfee5af4c2fdfc1e86f303a"
      FOREIGN KEY ("submittedById") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_914314cb5fc68d7c0c4d796dae6'
      AND table_name = 'customs_compliance_responses'
  ) THEN
    ALTER TABLE "customs_compliance_responses"
      ADD CONSTRAINT "FK_914314cb5fc68d7c0c4d796dae6"
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;
