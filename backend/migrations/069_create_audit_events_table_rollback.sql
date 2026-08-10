-- =============================================================================
-- Rollback Migration: 069_create_audit_events_table_rollback.sql
-- Description: Rollback creation of audit_events table
-- Author: System Migration
-- Date: 2026-08-10
-- =============================================================================

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_audit_events_updated_at ON audit_events;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_audit_events_updated_at();

-- Drop foreign key constraints
ALTER TABLE IF EXISTS audit_events DROP CONSTRAINT IF EXISTS fk_audit_events_reviewed_by;
ALTER TABLE IF EXISTS audit_events DROP CONSTRAINT IF EXISTS fk_audit_events_actor_id;
ALTER TABLE IF EXISTS audit_events DROP CONSTRAINT IF EXISTS fk_audit_events_load_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_audit_events_load_created;
DROP INDEX IF EXISTS idx_audit_events_created_at;
DROP INDEX IF EXISTS idx_audit_events_actor_id;
DROP INDEX IF EXISTS idx_audit_events_action;
DROP INDEX IF EXISTS idx_audit_events_entity_type;
DROP INDEX IF EXISTS idx_audit_events_load_id;

-- Drop the table
DROP TABLE IF EXISTS audit_events;

-- Drop the enums (careful - only if no other tables use them)
DROP TYPE IF EXISTS audit_events_action_enum;
DROP TYPE IF EXISTS audit_events_entitytype_enum;

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'audit_events table and related objects dropped successfully';
END $$;