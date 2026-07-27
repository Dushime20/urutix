-- Fix: GET /api/disputes 500 — production disputes_v2 schema predates the
-- DisputeV2 TypeORM entity (camelCase columns, child tables, enum values).
-- Aligns tables/columns so support ticket queries succeed.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. TypeORM enum types (quoted identifiers) ───────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_category_enum') THEN
    CREATE TYPE public."disputes_v2_category_enum" AS ENUM (
      'PAYMENT_ISSUE','DELIVERY_DELAY','CARGO_DAMAGE','CARGO_LOSS','ROUTE_VIOLATION',
      'CONTRACT_VIOLATION','DRIVER_MISCONDUCT','VEHICLE_DAMAGE','LOADING_DELAY',
      'UNLOADING_DELAY','DOCUMENTATION_ISSUE','FRAUD_SUSPECTED','OTHER',
      'TRUCK_BREAKDOWN','AUCTION_ISSUE','BROKER_COMPLAINT','LENDER_COMPLAINT',
      'IDENTITY_VERIFICATION','INSURANCE_CLAIM','ACCOUNT_SUSPENSION',
      'TECHNICAL_PROBLEM','BILLING_ISSUE','SUBSCRIPTION_ISSUE',
      'FEATURE_REQUEST','SECURITY_CONCERN'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_priority_enum') THEN
    CREATE TYPE public."disputes_v2_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_status_enum') THEN
    CREATE TYPE public."disputes_v2_status_enum" AS ENUM (
      'OPEN','UNDER_REVIEW','ASSIGNED','INVESTIGATING','AWAITING_INFORMATION',
      'ESCALATED','RESOLVED','REJECTED','CLOSED','REOPENED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_assignedrole_enum') THEN
    CREATE TYPE public."disputes_v2_assignedrole_enum" AS ENUM (
      'SUPPORT_OFFICER','OPERATIONS_MANAGER','FINANCE_OFFICER',
      'COMPLIANCE_OFFICER','LEGAL_OFFICER','ADMIN'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_escalationreason_enum') THEN
    CREATE TYPE public."disputes_v2_escalationreason_enum" AS ENUM (
      'SLA_BREACH','CRITICAL_UNRESPONDED','MULTIPLE_REOPENS',
      'FRAUD_DETECTED','PAYMENT_DISPUTE_THRESHOLD','MANUAL'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_resolutions_decision_enum') THEN
    CREATE TYPE public."dispute_resolutions_decision_enum" AS ENUM (
      'FAVOR_COMPLAINANT','FAVOR_RESPONDENT','MUTUAL_SETTLEMENT'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_assignments_assignedrole_enum') THEN
    CREATE TYPE public."dispute_assignments_assignedrole_enum" AS ENUM (
      'SUPPORT_OFFICER','OPERATIONS_MANAGER','FINANCE_OFFICER',
      'COMPLIANCE_OFFICER','LEGAL_OFFICER','ADMIN'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_escalations_reason_enum') THEN
    CREATE TYPE public."dispute_escalations_reason_enum" AS ENUM (
      'SLA_BREACH','CRITICAL_UNRESPONDED','MULTIPLE_REOPENS',
      'FRAUD_DETECTED','PAYMENT_DISPUTE_THRESHOLD','MANUAL'
    );
  END IF;
END $$;

-- ── 2. disputes_v2 — create or align camelCase columns ─────────────────────

CREATE TABLE IF NOT EXISTS disputes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  "referenceNumber" character varying(50) NOT NULL DEFAULT '',
  "ticketNumber" character varying(30),
  title character varying(255) NOT NULL DEFAULT 'Support ticket',
  description text NOT NULL DEFAULT '',
  category public."disputes_v2_category_enum" NOT NULL DEFAULT 'OTHER',
  priority public."disputes_v2_priority_enum" NOT NULL DEFAULT 'MEDIUM',
  status public."disputes_v2_status_enum" NOT NULL DEFAULT 'OPEN',
  "complainantUserId" uuid NOT NULL,
  "respondentUserId" uuid,
  "assignedToUserId" uuid,
  "assignedRole" public."disputes_v2_assignedrole_enum",
  "assignedAt" TIMESTAMPTZ,
  "tripId" uuid,
  "shipmentId" uuid,
  "truckId" uuid,
  "contractId" uuid,
  "invoiceId" uuid,
  "auctionId" uuid,
  "paymentId" uuid,
  "driverId" uuid,
  "brokerId" uuid,
  "lenderId" uuid,
  location character varying(500),
  "incidentDate" TIMESTAMPTZ,
  "additionalNotes" text,
  "slaFirstResponseDue" TIMESTAMPTZ,
  "slaResolutionDue" TIMESTAMPTZ,
  "firstResponseAt" TIMESTAMPTZ,
  "slaFirstResponseBreached" boolean NOT NULL DEFAULT false,
  "slaResolutionBreached" boolean NOT NULL DEFAULT false,
  "reopenCount" integer NOT NULL DEFAULT 0,
  "escalationLevel" integer NOT NULL DEFAULT 0,
  "escalationReason" public."disputes_v2_escalationreason_enum",
  "escalatedAt" TIMESTAMPTZ,
  "escalatedByUserId" uuid,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "closedAt" TIMESTAMPTZ,
  "resolvedAt" TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2') THEN
    -- Core columns expected by DisputeV2 entity
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "referenceNumber" character varying(50);
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "ticketNumber" character varying(30);
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS title character varying(255);
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS priority public."disputes_v2_priority_enum" DEFAULT 'MEDIUM';
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "complainantUserId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "respondentUserId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "assignedToUserId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "assignedRole" public."disputes_v2_assignedrole_enum";
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "tripId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "shipmentId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "truckId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "contractId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "invoiceId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "auctionId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "paymentId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "driverId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "brokerId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "lenderId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "incidentDate" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "additionalNotes" text;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "slaFirstResponseDue" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "slaResolutionDue" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "slaFirstResponseBreached" boolean DEFAULT false;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "slaResolutionBreached" boolean DEFAULT false;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "reopenCount" integer DEFAULT 0;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "escalationLevel" integer DEFAULT 0;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "escalationReason" public."disputes_v2_escalationreason_enum";
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "escalatedByUserId" uuid;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMPTZ;
    ALTER TABLE disputes_v2 ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Backfill from legacy snake_case / older column names (best-effort).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2') THEN
  UPDATE disputes_v2 SET
    "complainantUserId" = COALESCE("complainantUserId", "reportedById"),
    "respondentUserId"  = COALESCE("respondentUserId", "againstId"),
    title               = COALESCE(NULLIF(title, ''), NULLIF(subject, ''), 'Support ticket'),
    "ticketNumber"      = COALESCE("ticketNumber", ticket_number),
    "assignedToUserId"  = COALESCE("assignedToUserId", assigned_to_user_id),
    "assignedAt"        = COALESCE("assignedAt", assigned_at),
    "auctionId"         = COALESCE("auctionId", auction_id),
    "paymentId"         = COALESCE("paymentId", payment_id),
    "driverId"          = COALESCE("driverId", driver_id),
    "brokerId"          = COALESCE("brokerId", broker_id),
    "lenderId"          = COALESCE("lenderId", lender_id),
    "incidentDate"      = COALESCE("incidentDate", incident_date),
    "additionalNotes"   = COALESCE("additionalNotes", additional_notes),
    "slaFirstResponseDue" = COALESCE("slaFirstResponseDue", sla_first_response_due),
    "slaResolutionDue"    = COALESCE("slaResolutionDue", sla_resolution_due),
    "firstResponseAt"     = COALESCE("firstResponseAt", first_response_at),
    "slaFirstResponseBreached" = COALESCE("slaFirstResponseBreached", sla_first_response_breached, false),
    "slaResolutionBreached"    = COALESCE("slaResolutionBreached", sla_resolution_breached, false),
    "reopenCount"       = COALESCE("reopenCount", reopen_count, 0),
    "escalationLevel"   = COALESCE("escalationLevel", escalation_level, 0),
    "escalatedAt"       = COALESCE("escalatedAt", escalated_at),
    "escalatedByUserId" = COALESCE("escalatedByUserId", escalated_by_user_id),
    "referenceNumber"   = COALESCE(
      NULLIF("referenceNumber", ''),
      NULLIF("ticketNumber", ''),
      NULLIF(ticket_number, ''),
      'DIS-' || UPPER(SUBSTRING(id::text, 1, 8))
    )
  WHERE "complainantUserId" IS NULL
     OR "referenceNumber" IS NULL
     OR "referenceNumber" = ''
     OR title IS NULL
     OR title = '';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'disputes_v2 backfill skipped: %', SQLERRM;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_v2_reference
  ON disputes_v2 ("tenantId", "referenceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_v2_ticket_camel
  ON disputes_v2 ("ticketNumber") WHERE "ticketNumber" IS NOT NULL;

-- ── 3. Child tables (camelCase columns for TypeORM) ─────────────────────────

CREATE TABLE IF NOT EXISTS dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  "senderId" uuid NOT NULL,
  message text NOT NULL,
  "isInternal" boolean NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute
  ON dispute_messages ("disputeId", "createdAt");

CREATE TABLE IF NOT EXISTS dispute_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  "uploadedBy" uuid NOT NULL,
  "fileName" character varying(255) NOT NULL,
  "fileUrl" text NOT NULL,
  "fileType" character varying(100),
  "fileSize" integer,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_attachments_dispute
  ON dispute_attachments ("disputeId");

CREATE TABLE IF NOT EXISTS dispute_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  "resolvedBy" uuid NOT NULL,
  decision public."dispute_resolutions_decision_enum" NOT NULL,
  "resolutionSummary" text NOT NULL,
  "adminNotes" text,
  "resolvedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_resolutions_dispute
  ON dispute_resolutions ("disputeId");

-- ── 4. dispute_audit_logs — align with DisputeAuditLog entity ────────────────

CREATE TABLE IF NOT EXISTS dispute_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  action character varying(100) NOT NULL,
  "performedBy" uuid NOT NULL,
  "oldValue" jsonb,
  "newValue" jsonb,
  notes text,
  "ipAddress" character varying(45),
  "userAgent" text,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispute_audit_logs') THEN
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "disputeId" uuid;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "performedBy" uuid;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "oldValue" jsonb;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "newValue" jsonb;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "ipAddress" character varying(45);
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "userAgent" text;
    ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

    UPDATE dispute_audit_logs SET
      "disputeId"   = COALESCE("disputeId", dispute_id),
      "performedBy" = COALESCE("performedBy", "userId"),
      "oldValue"    = COALESCE("oldValue", old_value),
      "newValue"    = COALESCE("newValue", new_value)
    WHERE "disputeId" IS NULL OR "performedBy" IS NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_audit_logs align skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_audit_dispute_camel
  ON dispute_audit_logs ("disputeId", "createdAt" DESC);

-- ── 5. dispute_assignments / dispute_escalations (camelCase) ────────────────

CREATE TABLE IF NOT EXISTS dispute_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  "assignedByUserId" uuid NOT NULL,
  "assignedToUserId" uuid NOT NULL,
  "assignedRole" public."dispute_assignments_assignedrole_enum",
  notes text,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispute_assignments') THEN
    ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "disputeId" uuid;
    ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedByUserId" uuid;
    ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedToUserId" uuid;
    ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedRole" public."dispute_assignments_assignedrole_enum";
    ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

    UPDATE dispute_assignments SET
      "disputeId"          = COALESCE("disputeId", dispute_id),
      "assignedByUserId"   = COALESCE("assignedByUserId", assigned_by_user_id),
      "assignedToUserId"   = COALESCE("assignedToUserId", assigned_to_user_id),
      "createdAt"          = COALESCE("createdAt", created_at, NOW())
    WHERE "disputeId" IS NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_assignments align skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_assignments_dispute_camel
  ON dispute_assignments ("disputeId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS dispute_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" uuid NOT NULL,
  "escalatedByUserId" uuid NOT NULL,
  reason public."dispute_escalations_reason_enum" NOT NULL,
  notes text,
  "escalationLevel" integer NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispute_escalations') THEN
    ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "disputeId" uuid;
    ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "escalatedByUserId" uuid;
    ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "escalationLevel" integer DEFAULT 1;
    ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

    UPDATE dispute_escalations SET
      "disputeId"         = COALESCE("disputeId", dispute_id),
      "escalatedByUserId" = COALESCE("escalatedByUserId", escalated_by_user_id),
      "createdAt"         = COALESCE("createdAt", created_at, NOW())
    WHERE "disputeId" IS NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_escalations align skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_escalations_dispute_camel
  ON dispute_escalations ("disputeId", "createdAt" DESC);

-- ── 6. Migrate category/status columns to TypeORM enum types ─────────────────

DO $$
DECLARE
  cat_udt text;
BEGIN
  SELECT c.udt_name INTO cat_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'disputes_v2'
    AND c.column_name = 'category';

  IF cat_udt = 'dispute_category' THEN
    ALTER TABLE disputes_v2
      ADD COLUMN IF NOT EXISTS category_new public."disputes_v2_category_enum";

    UPDATE disputes_v2 SET category_new = (
      CASE category::text
        WHEN 'PAYMENT' THEN 'PAYMENT_ISSUE'
        WHEN 'DAMAGE' THEN 'CARGO_DAMAGE'
        WHEN 'DELAY' THEN 'DELIVERY_DELAY'
        WHEN 'DOCUMENTATION' THEN 'DOCUMENTATION_ISSUE'
        WHEN 'SERVICE' THEN 'OTHER'
        ELSE category::text
      END
    )::public."disputes_v2_category_enum"
    WHERE category_new IS NULL;

    UPDATE disputes_v2 SET category_new = 'OTHER'::public."disputes_v2_category_enum"
    WHERE category_new IS NULL;

    ALTER TABLE disputes_v2 DROP COLUMN category;
    ALTER TABLE disputes_v2 RENAME COLUMN category_new TO category;
    ALTER TABLE disputes_v2 ALTER COLUMN category SET NOT NULL;
    ALTER TABLE disputes_v2 ALTER COLUMN category SET DEFAULT 'OTHER'::public."disputes_v2_category_enum";
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'disputes_v2 category column migration skipped: %', SQLERRM;
END $$;

DO $$
DECLARE
  status_udt text;
BEGIN
  SELECT c.udt_name INTO status_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'disputes_v2'
    AND c.column_name = 'status';

  IF status_udt = 'dispute_status_v2' THEN
    ALTER TABLE disputes_v2
      ADD COLUMN IF NOT EXISTS status_new public."disputes_v2_status_enum";

    UPDATE disputes_v2 SET status_new = (
      CASE status::text
        WHEN 'IN_REVIEW' THEN 'UNDER_REVIEW'
        ELSE status::text
      END
    )::public."disputes_v2_status_enum"
    WHERE status_new IS NULL;

    UPDATE disputes_v2 SET status_new = 'OPEN'::public."disputes_v2_status_enum"
    WHERE status_new IS NULL;

    ALTER TABLE disputes_v2 DROP COLUMN status;
    ALTER TABLE disputes_v2 RENAME COLUMN status_new TO status;
    ALTER TABLE disputes_v2 ALTER COLUMN status SET NOT NULL;
    ALTER TABLE disputes_v2 ALTER COLUMN status SET DEFAULT 'OPEN'::public."disputes_v2_status_enum";
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'disputes_v2 status column migration skipped: %', SQLERRM;
END $$;
