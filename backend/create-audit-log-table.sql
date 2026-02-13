-- Create permission_audit_log table if it doesn't exist
-- This table tracks all permission-related changes

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON permission_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON permission_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON permission_audit_log(action);

-- Add comment
COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission-related changes';
