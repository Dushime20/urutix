-- Fix: POST /api/disputes 500 — dispute_audit_logs (and related child tables)
-- still have legacy snake_case NOT NULL columns (dispute_id, …) from 000/050 while
-- TypeORM writes camelCase ("disputeId", …). Inserts satisfy camelCase but leave
-- legacy columns NULL → NOT NULL violation.
-- Idempotent — safe to re-run.

-- ── dispute_audit_logs ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dispute_audit_logs'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "disputeId" uuid;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "performedBy" uuid;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "oldValue" jsonb;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "newValue" jsonb;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "ipAddress" character varying(45);
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "userAgent" text;
  ALTER TABLE dispute_audit_logs ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dispute_audit_logs' AND column_name = 'dispute_id'
  ) THEN
    UPDATE dispute_audit_logs SET
      "disputeId"   = COALESCE("disputeId", dispute_id),
      "performedBy" = COALESCE("performedBy", "userId"),
      "oldValue"    = COALESCE("oldValue", old_value),
      "newValue"    = COALESCE("newValue", new_value),
      "ipAddress"   = COALESCE("ipAddress", ip_address),
      "userAgent"   = COALESCE("userAgent", user_agent),
      "createdAt"   = COALESCE("createdAt", "createdAt")
    WHERE "disputeId" IS NULL
       OR "performedBy" IS NULL
       OR ("disputeId" IS DISTINCT FROM dispute_id AND dispute_id IS NOT NULL);

    ALTER TABLE dispute_audit_logs DROP CONSTRAINT IF EXISTS dispute_audit_logs_dispute_id_fkey;
    DROP INDEX IF EXISTS idx_dispute_audit_dispute;
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS dispute_id;
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS "userId";
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS old_value;
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS new_value;
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS ip_address;
    ALTER TABLE dispute_audit_logs DROP COLUMN IF EXISTS user_agent;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dispute_audit_logs WHERE "disputeId" IS NULL) THEN
    ALTER TABLE dispute_audit_logs ALTER COLUMN "disputeId" SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dispute_audit_logs WHERE "performedBy" IS NULL) THEN
    ALTER TABLE dispute_audit_logs ALTER COLUMN "performedBy" SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_audit_dispute_camel
  ON dispute_audit_logs ("disputeId", "createdAt" DESC);

-- ── dispute_assignments ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dispute_assignments'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "disputeId" uuid;
  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedByUserId" uuid;
  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedToUserId" uuid;
  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "assignedRole" public."dispute_assignments_assignedrole_enum";
  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE dispute_assignments ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dispute_assignments' AND column_name = 'dispute_id'
  ) THEN
    UPDATE dispute_assignments SET
      "disputeId"        = COALESCE("disputeId", dispute_id),
      "assignedByUserId" = COALESCE("assignedByUserId", assigned_by_user_id),
      "assignedToUserId" = COALESCE("assignedToUserId", assigned_to_user_id),
      "createdAt"        = COALESCE("createdAt", created_at, NOW())
    WHERE "disputeId" IS NULL;

    ALTER TABLE dispute_assignments DROP CONSTRAINT IF EXISTS dispute_assignments_dispute_id_fkey;
    DROP INDEX IF EXISTS idx_dispute_assignments_dispute;
    ALTER TABLE dispute_assignments DROP COLUMN IF EXISTS dispute_id;
    ALTER TABLE dispute_assignments DROP COLUMN IF EXISTS assigned_by_user_id;
    ALTER TABLE dispute_assignments DROP COLUMN IF EXISTS assigned_to_user_id;
    ALTER TABLE dispute_assignments DROP COLUMN IF EXISTS assigned_role;
    ALTER TABLE dispute_assignments DROP COLUMN IF EXISTS created_at;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_assignments_dispute_camel
  ON dispute_assignments ("disputeId", "createdAt" DESC);

-- ── dispute_escalations ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dispute_escalations'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "disputeId" uuid;
  ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "escalatedByUserId" uuid;
  ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "escalationLevel" integer DEFAULT 1;
  ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE dispute_escalations ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dispute_escalations' AND column_name = 'dispute_id'
  ) THEN
    UPDATE dispute_escalations SET
      "disputeId"         = COALESCE("disputeId", dispute_id),
      "escalatedByUserId" = COALESCE("escalatedByUserId", escalated_by_user_id),
      "escalationLevel"   = COALESCE("escalationLevel", escalation_level, 1),
      "createdAt"         = COALESCE("createdAt", created_at, NOW())
    WHERE "disputeId" IS NULL;

    ALTER TABLE dispute_escalations DROP CONSTRAINT IF EXISTS dispute_escalations_dispute_id_fkey;
    DROP INDEX IF EXISTS idx_dispute_escalations_dispute;
    ALTER TABLE dispute_escalations DROP COLUMN IF EXISTS dispute_id;
    ALTER TABLE dispute_escalations DROP COLUMN IF EXISTS escalated_by_user_id;
    ALTER TABLE dispute_escalations DROP COLUMN IF EXISTS escalation_level;
    ALTER TABLE dispute_escalations DROP COLUMN IF EXISTS created_at;

    -- reason may be varchar legacy; entity uses enum type added in 061
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'dispute_escalations'
        AND column_name = 'reason' AND udt_name <> 'dispute_escalations_reason_enum'
    ) THEN
      ALTER TABLE dispute_escalations
        ALTER COLUMN reason TYPE public."dispute_escalations_reason_enum"
        USING reason::text::public."dispute_escalations_reason_enum";
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_escalations_dispute_camel
  ON dispute_escalations ("disputeId", "createdAt" DESC);
