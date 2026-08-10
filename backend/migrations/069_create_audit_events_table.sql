-- =============================================================================
-- Migration: 069_create_audit_events_table.sql
-- Description: Create audit_events table for tracking load history and changes
-- Author: System Migration
-- Date: 2026-08-10
-- =============================================================================

-- Create audit event enums if they don't exist
DO $$ BEGIN
    CREATE TYPE audit_events_entitytype_enum AS ENUM (
        'load', 'document', 'tracking', 'alert', 'bid', 'trip'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_events_action_enum AS ENUM (
        'create', 'update', 'delete', 'publish', 'assign', 'start', 
        'deliver', 'cancel', 'repost', 'status_change', 'document_upload', 
        'document_delete', 'location_update', 'pricing_update', 'alert_create', 
        'alert_update', 'tracking_update', 'bulk_operation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    "entityType" audit_events_entitytype_enum NOT NULL DEFAULT 'load',
    "entityId" UUID,
    action audit_events_action_enum NOT NULL,
    "actorId" UUID,
    "actorName" VARCHAR(255),
    "actorEmail" VARCHAR(255),
    "actorRole" VARCHAR(100),
    description TEXT,
    reason TEXT,
    before JSONB,
    after JSONB,
    changes JSONB,
    metadata JSONB,
    "ipAddress" INET,
    "userAgent" TEXT,
    "sessionId" VARCHAR(255),
    "requestId" VARCHAR(255),
    "externalReference" VARCHAR(255),
    "externalSystem" VARCHAR(100),
    "isAutomated" BOOLEAN DEFAULT false,
    "automationSource" VARCHAR(100),
    "relatedEntities" JSONB,
    notes TEXT,
    tags VARCHAR(255)[],
    "isSensitive" BOOLEAN DEFAULT false,
    "requiresReview" BOOLEAN DEFAULT false,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP WITH TIME ZONE,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_events_load_id ON audit_events("loadId");
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_type ON audit_events("entityType");
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events("actorId");
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events("createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_events_load_created ON audit_events("loadId", "createdAt");

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    -- Check if loads table exists before adding FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loads') THEN
        ALTER TABLE audit_events 
        ADD CONSTRAINT fk_audit_events_load_id 
        FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Check if users table exists before adding FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE audit_events 
        ADD CONSTRAINT fk_audit_events_actor_id 
        FOREIGN KEY ("actorId") REFERENCES users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Check if users table exists before adding FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE audit_events 
        ADD CONSTRAINT fk_audit_events_reviewed_by 
        FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_audit_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_events_updated_at ON audit_events;
CREATE TRIGGER trigger_audit_events_updated_at
    BEFORE UPDATE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_events_updated_at();

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'audit_events table created successfully with indexes and constraints';
END $$;