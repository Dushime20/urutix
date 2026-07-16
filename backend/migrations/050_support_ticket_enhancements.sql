-- ============================================================
-- Migration 050: Support Ticket Enhancements
-- Extends disputes_v2 with ticket numbers, SLA, assignment,
-- escalation tracking and new category/status enum values.
-- @no-transaction  -- ALTER TYPE ADD VALUE cannot run inside a transaction
-- ============================================================

-- Skip entirely if disputes_v2 was never created
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2'
  ) THEN
    RAISE NOTICE 'disputes_v2 missing — skipping 050 support ticket enhancements';
  END IF;
END $$;

-- ── 1. Add new enum values to existing enums ──────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_v2') THEN
    ALTER TYPE dispute_status_v2 ADD VALUE IF NOT EXISTS 'ASSIGNED';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_status_v2 ASSIGNED: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_v2') THEN
    ALTER TYPE dispute_status_v2 ADD VALUE IF NOT EXISTS 'INVESTIGATING';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_status_v2 INVESTIGATING: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_category') THEN
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'TRUCK_BREAKDOWN';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'AUCTION_ISSUE';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'BROKER_COMPLAINT';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'LENDER_COMPLAINT';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'IDENTITY_VERIFICATION';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'INSURANCE_CLAIM';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'ACCOUNT_SUSPENSION';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'TECHNICAL_PROBLEM';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'BILLING_ISSUE';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_ISSUE';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'FEATURE_REQUEST';
    ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'SECURITY_CONCERN';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'dispute_category values: %', SQLERRM;
END $$;

-- ── 2. Add new columns to disputes_v2 (only if table exists) ─

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2') THEN
    ALTER TABLE disputes_v2
      ADD COLUMN IF NOT EXISTS ticket_number          VARCHAR(30),
      ADD COLUMN IF NOT EXISTS assigned_to_user_id    UUID,
      ADD COLUMN IF NOT EXISTS assigned_role          VARCHAR(50),
      ADD COLUMN IF NOT EXISTS assigned_at            TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS auction_id             UUID,
      ADD COLUMN IF NOT EXISTS payment_id             UUID,
      ADD COLUMN IF NOT EXISTS driver_id              UUID,
      ADD COLUMN IF NOT EXISTS broker_id              UUID,
      ADD COLUMN IF NOT EXISTS lender_id              UUID,
      ADD COLUMN IF NOT EXISTS location               VARCHAR(500),
      ADD COLUMN IF NOT EXISTS incident_date          TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS additional_notes       TEXT,
      ADD COLUMN IF NOT EXISTS sla_first_response_due TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sla_resolution_due     TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS first_response_at      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sla_first_response_breached BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS sla_resolution_breached     BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS reopen_count           INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS escalation_level       INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS escalation_reason      VARCHAR(60),
      ADD COLUMN IF NOT EXISTS escalated_at           TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS escalated_by_user_id   UUID;
  END IF;
END $$;

-- ── 3. Indexes on disputes_v2 (only if table exists) ─────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_v2_ticket_number ON disputes_v2 (ticket_number) WHERE ticket_number IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_disputes_v2_assigned_to ON disputes_v2 (assigned_to_user_id, status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_disputes_v2_sla_first_response ON disputes_v2 (sla_first_response_due) WHERE sla_first_response_breached = FALSE AND first_response_at IS NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_disputes_v2_sla_resolution ON disputes_v2 (sla_resolution_due) WHERE sla_resolution_breached = FALSE';
  END IF;
END $$;

-- ── 4. Add ip_address column to dispute_audit_logs ───────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispute_audit_logs') THEN
    ALTER TABLE dispute_audit_logs
      ADD COLUMN IF NOT EXISTS ip_address  VARCHAR(45),
      ADD COLUMN IF NOT EXISTS user_agent  TEXT;
  END IF;
END $$;

-- ── 5. Create dispute_assignments table ──────────────────────

CREATE TABLE IF NOT EXISTS dispute_assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id          UUID NOT NULL,
  assigned_by_user_id UUID NOT NULL,
  assigned_to_user_id UUID NOT NULL,
  assigned_role       VARCHAR(50),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dispute_assignments_dispute_id_fkey') THEN
    ALTER TABLE dispute_assignments
      ADD CONSTRAINT dispute_assignments_dispute_id_fkey
      FOREIGN KEY (dispute_id) REFERENCES disputes_v2(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_assignments_dispute
  ON dispute_assignments (dispute_id, created_at DESC);

-- ── 6. Create dispute_escalations table ──────────────────────

CREATE TABLE IF NOT EXISTS dispute_escalations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id           UUID NOT NULL,
  escalated_by_user_id UUID NOT NULL,
  reason               VARCHAR(60) NOT NULL,
  notes                TEXT,
  escalation_level     INTEGER DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dispute_escalations_dispute_id_fkey') THEN
    ALTER TABLE dispute_escalations
      ADD CONSTRAINT dispute_escalations_dispute_id_fkey
      FOREIGN KEY (dispute_id) REFERENCES disputes_v2(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispute_escalations_dispute
  ON dispute_escalations (dispute_id, created_at DESC);

-- ── 7. Back-fill ticket_number for existing rows ─────────────

DO $$
DECLARE
  rec    RECORD;
  yr     TEXT;
  seq    INT := 1;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disputes_v2') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'disputes_v2' AND column_name = 'ticket_number'
  ) THEN
    RETURN;
  END IF;
  FOR rec IN
    SELECT id, created_at, tenant_id
    FROM   disputes_v2
    WHERE  ticket_number IS NULL
    ORDER  BY created_at
  LOOP
    yr := TO_CHAR(rec.created_at, 'YYYY');
    UPDATE disputes_v2
    SET    ticket_number = 'SUP-' || yr || '-' || LPAD(seq::TEXT, 6, '0')
    WHERE  id = rec.id;
    seq := seq + 1;
  END LOOP;
END $$;

COMMENT ON TABLE dispute_assignments  IS 'History of all ticket assignments';
COMMENT ON TABLE dispute_escalations  IS 'History of all ticket escalations';
