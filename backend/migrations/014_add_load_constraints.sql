-- Migration: Add Load Constraints for Data Integrity
-- Date: 2026-02-17
-- Purpose: Add database-level constraints to ensure data integrity and prevent invalid data

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Ensure weight is positive
ALTER TABLE loads 
  ADD CONSTRAINT check_weight_positive 
  CHECK (weight > 0);

-- Ensure load value is non-negative
ALTER TABLE loads 
  ADD CONSTRAINT check_load_value_non_negative 
  CHECK (load_value >= 0);

-- Ensure offered price is non-negative (if provided)
ALTER TABLE loads 
  ADD CONSTRAINT check_offered_price_non_negative 
  CHECK (offered_price IS NULL OR offered_price >= 0);

-- Ensure delivery date is after or equal to pickup date
ALTER TABLE loads 
  ADD CONSTRAINT check_dates_logical 
  CHECK (delivery_date >= pickup_date);

-- Ensure volume is positive (if provided)
ALTER TABLE loads 
  ADD CONSTRAINT check_volume_positive 
  CHECK (volume IS NULL OR volume > 0);

-- Ensure units required is at least 1
ALTER TABLE loads 
  ADD CONSTRAINT check_units_required_positive 
  CHECK (units_required >= 1);

-- Ensure number of pieces is non-negative (if provided)
ALTER TABLE loads 
  ADD CONSTRAINT check_number_of_pieces_non_negative 
  CHECK (number_of_pieces IS NULL OR number_of_pieces >= 0);

-- Ensure number of pallets is non-negative (if provided)
ALTER TABLE loads 
  ADD CONSTRAINT check_number_of_pallets_non_negative 
  CHECK (number_of_pallets IS NULL OR number_of_pallets >= 0);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index for soft delete queries (WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_loads_deleted_at 
  ON loads(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Composite index for common tenant + status + pickup date queries
CREATE INDEX IF NOT EXISTS idx_loads_tenant_status_pickup 
  ON loads(tenant_id, status, pickup_date) 
  WHERE deleted_at IS NULL;

-- Index for cargo owner queries (my loads)
CREATE INDEX IF NOT EXISTS idx_loads_cargo_owner_status 
  ON loads(cargo_owner_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for broker queries
CREATE INDEX IF NOT EXISTS idx_loads_broker_status 
  ON loads(broker_id, status, created_at DESC) 
  WHERE deleted_at IS NULL AND broker_id IS NOT NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_loads_date_range 
  ON loads(pickup_date, delivery_date) 
  WHERE deleted_at IS NULL;

-- Index for urgency level queries
CREATE INDEX IF NOT EXISTS idx_loads_urgency_status 
  ON loads(urgency_level, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for cargo type queries
CREATE INDEX IF NOT EXISTS idx_loads_cargo_type_status 
  ON loads(cargo_type, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for visibility queries (public/private loads)
CREATE INDEX IF NOT EXISTS idx_loads_visibility_status 
  ON loads(visibility, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT check_weight_positive ON loads IS 
  'Ensures weight is always positive (greater than 0)';

COMMENT ON CONSTRAINT check_load_value_non_negative ON loads IS 
  'Ensures load value is non-negative (0 or greater)';

COMMENT ON CONSTRAINT check_dates_logical ON loads IS 
  'Ensures delivery date is not before pickup date';

COMMENT ON CONSTRAINT check_volume_positive ON loads IS 
  'Ensures volume is positive when provided';

COMMENT ON INDEX idx_loads_tenant_status_pickup IS 
  'Optimizes queries filtering by tenant, status, and pickup date';

COMMENT ON INDEX idx_loads_cargo_owner_status IS 
  'Optimizes cargo owner queries for their loads';

COMMENT ON INDEX idx_loads_broker_status IS 
  'Optimizes broker queries for assigned loads';

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_weight_positive;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_load_value_non_negative;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_offered_price_non_negative;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_dates_logical;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_volume_positive;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_units_required_positive;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_number_of_pieces_non_negative;
-- ALTER TABLE loads DROP CONSTRAINT IF EXISTS check_number_of_pallets_non_negative;
-- DROP INDEX IF EXISTS idx_loads_deleted_at;
-- DROP INDEX IF EXISTS idx_loads_tenant_status_pickup;
-- DROP INDEX IF EXISTS idx_loads_cargo_owner_status;
-- DROP INDEX IF EXISTS idx_loads_broker_status;
-- DROP INDEX IF EXISTS idx_loads_date_range;
-- DROP INDEX IF EXISTS idx_loads_urgency_status;
-- DROP INDEX IF EXISTS idx_loads_cargo_type_status;
-- DROP INDEX IF EXISTS idx_loads_visibility_status;
