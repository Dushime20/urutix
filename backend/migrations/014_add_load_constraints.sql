-- Migration: 014_add_load_constraints.sql
-- Purpose: Add CHECK constraints and performance indexes to the loads table.
--
-- IDEMPOTENCY: every ALTER TABLE ADD CONSTRAINT is wrapped in a DO block that
-- checks pg_constraint first, so re-running this file is a safe no-op.

-- ============================================================================
-- CHECK CONSTRAINTS (all guarded)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_weight_positive' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_weight_positive CHECK (weight > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_load_value_non_negative' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_load_value_non_negative CHECK ("loadValue" >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_offered_price_non_negative' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_offered_price_non_negative CHECK ("offeredPrice" IS NULL OR "offeredPrice" >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_dates_logical' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_dates_logical CHECK ("deliveryDate" >= "pickupDate" OR "deliveryDate" IS NULL OR "pickupDate" IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_volume_positive' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_volume_positive CHECK (volume IS NULL OR volume > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_units_required_positive' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_units_required_positive CHECK ("unitsRequired" >= 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_number_of_pieces_non_negative' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_number_of_pieces_non_negative CHECK ("numberOfPieces" IS NULL OR "numberOfPieces" >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_number_of_pallets_non_negative' AND conrelid = 'loads'::regclass) THEN
    ALTER TABLE loads ADD CONSTRAINT check_number_of_pallets_non_negative CHECK ("numberOfPallets" IS NULL OR "numberOfPallets" >= 0);
  END IF;
END $$;

-- ============================================================================
-- PERFORMANCE INDEXES (all IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_loads_deleted_at
  ON loads(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loads_tenant_status_pickup
  ON loads("tenantId", status, "pickupDate") WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_cargo_owner_status
  ON loads("cargoOwnerId", status, "createdAt" DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_broker_status
  ON loads("brokerId", status, "createdAt" DESC)
  WHERE deleted_at IS NULL AND "brokerId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loads_date_range
  ON loads("pickupDate", "deliveryDate") WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_urgency_status
  ON loads("urgencyLevel", status, "createdAt" DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_cargo_type_status
  ON loads("cargoType", status, "createdAt" DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_visibility_status
  ON loads(visibility, status, "createdAt" DESC) WHERE deleted_at IS NULL;
