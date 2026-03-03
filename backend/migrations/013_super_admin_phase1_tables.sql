-- Super Admin Enhancement Phase 1 Tables
-- Migration: 013_super_admin_phase1_tables
-- Description: Create tables for system health monitoring, security events, user sessions, and enhance existing tables

-- ============================================================================
-- 1. SYSTEM HEALTH LOGS TABLE (with TimescaleDB hypertable support)
-- ============================================================================

-- Note: The system_health_logs table already exists from migration 010 and 011
-- We'll ensure it has all required columns for Phase 1

-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Add created_at if it doesn't exist (for consistency with spec)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_health_logs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE system_health_logs ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  
  -- Rename checked_at to timestamp if needed (spec uses timestamp)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_health_logs' AND column_name = 'checked_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_health_logs' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE system_health_logs RENAME COLUMN checked_at TO timestamp;
  END IF;
END $$;

-- Update indexes to use timestamp column
DROP INDEX IF EXISTS idx_system_health_checked_at;
DROP INDEX IF EXISTS idx_system_health_service_checked;
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_service_timestamp ON system_health_logs(service, timestamp DESC);

-- Enable TimescaleDB hypertable for time-series data (if TimescaleDB extension is available)
-- This improves performance for time-range queries on large datasets
DO $$
BEGIN
  -- Check if TimescaleDB extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Check if table is not already a hypertable
    IF NOT EXISTS (
      SELECT 1 FROM timescaledb_information.hypertables 
      WHERE hypertable_name = 'system_health_logs'
    ) THEN
      PERFORM create_hypertable('system_health_logs', 'timestamp', 
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
      RAISE NOTICE 'Created TimescaleDB hypertable for system_health_logs';
    END IF;
  ELSE
    RAISE NOTICE 'TimescaleDB extension not available, skipping hypertable creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create hypertable: %', SQLERRM;
END $$;

-- Update comments
COMMENT ON TABLE system_health_logs IS 'Stores system health metrics and logs for monitoring (Phase 1)';
COMMENT ON COLUMN system_health_logs.timestamp IS 'Timestamp when the metric was recorded';

-- ============================================================================
-- 2. SECURITY EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for tenant_id separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_security_events_tenant' 
    AND table_name = 'security_events'
  ) THEN
    ALTER TABLE security_events 
    ADD CONSTRAINT fk_security_events_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE security_events IS 'Tracks security-related events across the platform (Phase 1)';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event: failed_login, permission_escalation, unusual_access, session_hijack';
COMMENT ON COLUMN security_events.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN security_events.user_id IS 'User associated with the security event (nullable)';
COMMENT ON COLUMN security_events.tenant_id IS 'Tenant associated with the security event (nullable)';
COMMENT ON COLUMN security_events.ip_address IS 'IP address from which the event originated';
COMMENT ON COLUMN security_events.user_agent IS 'User agent string from the request';
COMMENT ON COLUMN security_events.details IS 'Additional event details in JSON format';
COMMENT ON COLUMN security_events.created_at IS 'Timestamp when the event was recorded';

-- ============================================================================
-- 3. USER SESSIONS TABLE
-- ============================================================================

-- Create or enhance user_sessions table
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    CREATE TABLE user_sessions (
      session_id VARCHAR(255) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
    RAISE NOTICE 'Created user_sessions table';
  ELSE
    RAISE NOTICE 'user_sessions table already exists, will enhance it';
  END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
  -- Rename id to session_id if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE user_sessions RENAME COLUMN id TO session_id;
    RAISE NOTICE 'Renamed id to session_id';
  END IF;

  -- Add tenant_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN tenant_id UUID;
    RAISE NOTICE 'Added tenant_id column to user_sessions';
  END IF;

  -- Add started_at if it doesn't exist (use created_at if available)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'started_at'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE user_sessions RENAME COLUMN created_at TO started_at;
      RAISE NOTICE 'Renamed created_at to started_at';
    ELSE
      ALTER TABLE user_sessions ADD COLUMN started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      RAISE NOTICE 'Added started_at column';
    END IF;
  END IF;

  -- Ensure last_activity exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added last_activity column';
  END IF;

  -- Ensure expires_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours');
    RAISE NOTICE 'Added expires_at column';
  END IF;

  -- Update ip_address type if needed (from inet to varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'ip_address' AND data_type = 'inet'
  ) THEN
    ALTER TABLE user_sessions ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    RAISE NOTICE 'Updated ip_address column type';
  END IF;
END $$;

-- Add foreign key constraint for tenant_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_sessions_tenant' 
    AND table_name = 'user_sessions'
  ) THEN
    -- First, populate tenant_id from users table for existing records
    UPDATE user_sessions us
    SET tenant_id = u."tenantId"
    FROM users u
    WHERE us.user_id = u.id AND us.tenant_id IS NULL;
    
    -- Now add the constraint
    ALTER TABLE user_sessions 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    ALTER TABLE user_sessions 
    ADD CONSTRAINT fk_user_sessions_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint for tenant_id';
  END IF;
END $$;

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- Add comments for documentation
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions for security monitoring (Phase 1)';
COMMENT ON COLUMN user_sessions.session_id IS 'Unique session identifier';
COMMENT ON COLUMN user_sessions.user_id IS 'User who owns this session';
COMMENT ON COLUMN user_sessions.tenant_id IS 'Tenant context for this session';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of the session';
COMMENT ON COLUMN user_sessions.user_agent IS 'User agent string from the browser';
COMMENT ON COLUMN user_sessions.started_at IS 'When the session was created';
COMMENT ON COLUMN user_sessions.last_activity IS 'Last activity timestamp for session timeout tracking';
COMMENT ON COLUMN user_sessions.expires_at IS 'When the session expires';

-- ============================================================================
-- 4. ENHANCE TENANTS TABLE
-- ============================================================================

-- Add health_score and last_health_check columns to tenants table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'health_score'
  ) THEN
    ALTER TABLE tenants ADD COLUMN health_score INTEGER DEFAULT 100;
    COMMENT ON COLUMN tenants.health_score IS 'Tenant health score (0-100) based on credit balance, subscription status, and activity';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'last_health_check'
  ) THEN
    ALTER TABLE tenants ADD COLUMN last_health_check TIMESTAMPTZ;
    COMMENT ON COLUMN tenants.last_health_check IS 'Timestamp of the last health score calculation';
  END IF;
END $$;

-- Create index for health monitoring queries
CREATE INDEX IF NOT EXISTS idx_tenants_health_score ON tenants(health_score);
CREATE INDEX IF NOT EXISTS idx_tenants_last_health_check ON tenants(last_health_check DESC);

-- ============================================================================
-- 5. ENHANCE ACTIVITY LOGS TABLE
-- ============================================================================

-- Note: activity_logs already has ip_address and user_agent columns
-- We only need to add security_relevant column

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_logs' AND column_name = 'security_relevant'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN security_relevant BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN activity_logs.security_relevant IS 'Flag indicating if this activity is security-relevant for monitoring';
  END IF;
END $$;

-- Create index for security-relevant activity queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_security_relevant ON activity_logs(security_relevant) WHERE security_relevant = TRUE;
CREATE INDEX IF NOT EXISTS idx_activity_logs_security_created ON activity_logs(security_relevant, created_at DESC) WHERE security_relevant = TRUE;

-- Update table comment
COMMENT ON TABLE activity_logs IS 'Tracks user activities and system events with security context (Enhanced Phase 1)';

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired sessions from user_sessions table';

-- Function to update last_activity timestamp on session
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_activity (if needed by application)
-- Note: This is optional and can be managed by application code
-- CREATE TRIGGER user_sessions_activity_update
--   BEFORE UPDATE ON user_sessions
--   FOR EACH ROW
--   EXECUTE FUNCTION update_session_activity();

-- ============================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for recent security events summary
CREATE OR REPLACE VIEW recent_security_events AS
SELECT 
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT tenant_id) as affected_tenants,
  MAX(created_at) as last_occurrence
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY event_count DESC;

COMMENT ON VIEW recent_security_events IS 'Summary of security events in the last 24 hours';

-- View for active sessions summary
CREATE OR REPLACE VIEW active_sessions_summary AS
SELECT 
  tenant_id,
  COUNT(*) as active_session_count,
  COUNT(DISTINCT user_id) as active_user_count,
  MAX(last_activity) as most_recent_activity
FROM user_sessions
WHERE expires_at > NOW()
GROUP BY tenant_id;

COMMENT ON VIEW active_sessions_summary IS 'Summary of active sessions per tenant';

-- View for tenant health overview
CREATE OR REPLACE VIEW tenant_health_overview AS
SELECT 
  t.id,
  t.name,
  t.subdomain,
  t.health_score,
  t.last_health_check,
  t."isActive" as is_active,
  t."subscriptionExpiresAt" as subscription_expires_at,
  CASE 
    WHEN t.health_score >= 80 THEN 'healthy'
    WHEN t.health_score >= 60 THEN 'warning'
    WHEN t.health_score >= 40 THEN 'degraded'
    ELSE 'critical'
  END as health_status
FROM tenants t
WHERE t.deleted_at IS NULL
ORDER BY t.health_score ASC, t.name;

COMMENT ON VIEW tenant_health_overview IS 'Overview of tenant health scores and status';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 013_super_admin_phase1_tables completed successfully';
  RAISE NOTICE 'Created tables: security_events, user_sessions';
  RAISE NOTICE 'Enhanced tables: system_health_logs, tenants, activity_logs';
  RAISE NOTICE 'Created views: recent_security_events, active_sessions_summary, tenant_health_overview';
  RAISE NOTICE 'Created functions: cleanup_expired_sessions, update_session_activity';
END $$;
