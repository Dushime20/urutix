-- Migration: Bulk Email Logs System
-- Description: Creates bulk_email_logs table for tracking email campaigns
-- Date: 2026-02-14

-- Create bulk_email_logs table
CREATE TABLE IF NOT EXISTS bulk_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bulk_email_logs_tenant ON bulk_email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_email_logs_template ON bulk_email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_bulk_email_logs_status ON bulk_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_email_logs_created_at ON bulk_email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_email_logs_created_by ON bulk_email_logs(created_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bulk_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bulk_email_logs_updated_at
  BEFORE UPDATE ON bulk_email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_email_logs_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE bulk_email_logs IS 'Tracks bulk email campaigns sent through the system';
COMMENT ON COLUMN bulk_email_logs.status IS 'Status: pending, sending, sent, failed, scheduled';
COMMENT ON COLUMN bulk_email_logs.metadata IS 'Additional metadata like filters, segments, etc.';
