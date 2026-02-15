-- System Health Monitoring Tables
-- Migration: 010_system_health_logs
-- Description: Create tables for system health monitoring and logging

-- Create system_health_logs table
CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time INTEGER,
  error_message TEXT,
  metadata JSONB,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_service_checked ON system_health_logs(service, checked_at DESC);

-- Add comments for documentation
COMMENT ON TABLE system_health_logs IS 'Stores system health check logs for monitoring';
COMMENT ON COLUMN system_health_logs.service IS 'Type of service being monitored (DATABASE, API, CACHE, etc.)';
COMMENT ON COLUMN system_health_logs.status IS 'Health status (HEALTHY, DEGRADED, DOWN)';
COMMENT ON COLUMN system_health_logs.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN system_health_logs.error_message IS 'Error message if status is not HEALTHY';
COMMENT ON COLUMN system_health_logs.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN system_health_logs.checked_at IS 'Timestamp when health check was performed';
