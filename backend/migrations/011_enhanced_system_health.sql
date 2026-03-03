-- Enhanced System Health Monitoring
-- Migration: 011_enhanced_system_health
-- Description: Enhance system health monitoring with comprehensive metrics and TimescaleDB support

-- Add new columns to system_health_logs for enhanced monitoring
ALTER TABLE system_health_logs 
  ADD COLUMN IF NOT EXISTS metric_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS metric_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS metric_value DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS threshold_value DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20);

-- Update existing columns to match spec
ALTER TABLE system_health_logs 
  ALTER COLUMN service TYPE VARCHAR(50),
  ALTER COLUMN status TYPE VARCHAR(20);

-- Add indexes for enhanced querying
CREATE INDEX IF NOT EXISTS idx_system_health_metric_type ON system_health_logs(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_health_severity ON system_health_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_health_metric_name ON system_health_logs(metric_name);

-- Add comments for new columns
COMMENT ON COLUMN system_health_logs.metric_type IS 'Type of metric (DATABASE, API, SERVER)';
COMMENT ON COLUMN system_health_logs.metric_name IS 'Specific metric name (cpu_usage, memory_usage, query_time, etc.)';
COMMENT ON COLUMN system_health_logs.metric_value IS 'Numeric value of the metric';
COMMENT ON COLUMN system_health_logs.threshold_value IS 'Threshold value that triggers alerts';
COMMENT ON COLUMN system_health_logs.severity IS 'Severity level (low, medium, high, critical)';

-- Create view for recent system health summary
CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
  service,
  status,
  AVG(response_time) as avg_response_time,
  MAX(checked_at) as last_checked,
  COUNT(*) as check_count
FROM system_health_logs
WHERE checked_at > NOW() - INTERVAL '1 hour'
GROUP BY service, status;

COMMENT ON VIEW system_health_summary IS 'Summary of system health checks in the last hour';
