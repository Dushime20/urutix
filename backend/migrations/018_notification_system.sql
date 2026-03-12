-- Migration: Enhanced Notification System
-- Description: Creates notification preferences and logs tables for comprehensive notification management
-- Date: 2024-12-12

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING', 
        'PAYMENT_FAILED', 'CREDITS_EXPIRED', 'USAGE_THRESHOLD', 'SYSTEM_MAINTENANCE'
    )),
    enabled_channels TEXT[] NOT NULL DEFAULT ARRAY['EMAIL', 'IN_APP'],
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    email_address VARCHAR(255),
    phone_number VARCHAR(20),
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_user ON notification_preferences(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_type ON notification_preferences(tenant_id, notification_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_unique ON notification_preferences(tenant_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), notification_type);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING', 
        'PAYMENT_FAILED', 'CREDITS_EXPIRED', 'USAGE_THRESHOLD', 'SYSTEM_MAINTENANCE'
    )),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    recipient_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED'
    )),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    metadata JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_sent ON notification_logs(tenant_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_sent ON notification_logs(status, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_sent ON notification_logs(notification_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_created ON notification_logs(user_id, created_at) WHERE user_id IS NOT NULL;

-- Create updated_at trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Insert default notification preferences for existing tenants
INSERT INTO notification_preferences (tenant_id, notification_type, enabled_channels, is_enabled, settings)
SELECT 
    t.id as tenant_id,
    unnest(ARRAY['LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING', 'PAYMENT_FAILED']) as notification_type,
    ARRAY['EMAIL', 'IN_APP'] as enabled_channels,
    true as is_enabled,
    '{"frequency": "IMMEDIATE"}'::jsonb as settings
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.tenant_id = t.id AND np.user_id IS NULL
);

-- Add comments for documentation
COMMENT ON TABLE notification_preferences IS 'Stores user and tenant notification preferences for different types of alerts';
COMMENT ON TABLE notification_logs IS 'Audit trail of all notifications sent through the system';
COMMENT ON COLUMN notification_preferences.settings IS 'JSON settings like frequency, thresholds, quiet hours, etc.';
COMMENT ON COLUMN notification_logs.metadata IS 'Additional data like template variables, tracking info, retry count, etc.';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notification_logs TO your_app_user;