-- Phase 4: Advanced Analytics & Market Leadership
-- Migration: 026_advanced_analytics_phase4.sql
-- Description: Advanced ML pipeline, real-time processing, and API marketplace

-- Advanced ML Models Table
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'cost_prediction', 'demand_forecast', 'route_optimization'
    model_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    training_data_size INTEGER DEFAULT 0,
    accuracy_score DECIMAL(5,4) DEFAULT 0.0000,
    model_parameters JSONB DEFAULT '{}',
    training_completed_at TIMESTAMP,
    last_prediction_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'training', -- 'training', 'active', 'deprecated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_tenant_model_version UNIQUE(tenant_id, model_name, model_version)
);

-- Real-time Analytics Stream Table
CREATE TABLE IF NOT EXISTS analytics_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stream_type VARCHAR(50) NOT NULL, -- 'cost_alert', 'performance_drop', 'demand_spike'
    event_data JSONB NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER DEFAULT 0
);

-- API Marketplace Keys Table
CREATE TABLE IF NOT EXISTS api_marketplace_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    key_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]', -- Array of allowed endpoints
    rate_limit_per_hour INTEGER DEFAULT 1000,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Tracking Table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_marketplace_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER DEFAULT 0,
    request_size_bytes INTEGER DEFAULT 0,
    response_size_bytes INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Advanced Analytics Views
CREATE OR REPLACE VIEW v_ml_model_performance AS
SELECT 
    m.id,
    m.tenant_id,
    m.model_name,
    m.model_type,
    m.model_version,
    m.accuracy_score,
    m.training_data_size,
    m.status,
    0 as prediction_count,
    0.0 as avg_confidence,
    m.created_at,
    m.last_prediction_at
FROM ml_models m;

-- Real-time Analytics Summary View
CREATE OR REPLACE VIEW v_realtime_analytics_summary AS
SELECT 
    tenant_id,
    stream_type,
    COUNT(*) as event_count,
    AVG(processing_time_ms) as avg_processing_time,
    MAX(processed_at) as last_event_at,
    DATE_TRUNC('hour', processed_at) as hour_bucket
FROM analytics_stream
WHERE processed_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY tenant_id, stream_type, DATE_TRUNC('hour', processed_at);

-- API Usage Analytics View
CREATE OR REPLACE VIEW v_api_usage_analytics AS
SELECT 
    k.tenant_id,
    k.key_name,
    k.api_key,
    COUNT(l.id) as total_requests,
    COUNT(CASE WHEN l.response_status < 400 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN l.response_status >= 400 THEN 1 END) as failed_requests,
    AVG(l.response_time_ms) as avg_response_time,
    SUM(l.request_size_bytes + l.response_size_bytes) as total_bandwidth,
    MAX(l.created_at) as last_request_at
FROM api_marketplace_keys k
LEFT JOIN api_usage_logs l ON l.api_key_id = k.id
WHERE k.is_active = true
GROUP BY k.tenant_id, k.key_name, k.api_key;

-- Advanced Analytics Functions
CREATE OR REPLACE FUNCTION fn_train_ml_model(
    p_tenant_id UUID,
    p_model_name VARCHAR,
    p_model_type VARCHAR,
    p_training_data_size INTEGER
) RETURNS UUID AS $$
DECLARE
    v_model_id UUID;
BEGIN
    INSERT INTO ml_models (tenant_id, model_name, model_type, training_data_size, status)
    VALUES (p_tenant_id, p_model_name, p_model_type, p_training_data_size, 'training')
    RETURNING id INTO v_model_id;
    
    RETURN v_model_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION fn_generate_api_key(
    p_tenant_id UUID,
    p_key_name VARCHAR,
    p_permissions JSONB,
    p_rate_limit INTEGER DEFAULT 1000
) RETURNS VARCHAR AS $$
DECLARE
    v_api_key VARCHAR(64);
BEGIN
    -- Generate secure API key
    v_api_key := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO api_marketplace_keys (
        tenant_id, api_key, key_name, permissions, rate_limit_per_hour
    ) VALUES (
        p_tenant_id, v_api_key, p_key_name, p_permissions, p_rate_limit
    );
    
    RETURN v_api_key;
END;
$$ LANGUAGE plpgsql;

-- Real-time Stream Processing Function
CREATE OR REPLACE FUNCTION fn_process_analytics_stream(
    p_tenant_id UUID,
    p_stream_type VARCHAR,
    p_event_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_processing_time INTEGER;
BEGIN
    v_start_time := CURRENT_TIMESTAMP;
    
    -- Insert stream event
    INSERT INTO analytics_stream (tenant_id, stream_type, event_data, processing_time_ms)
    VALUES (
        p_tenant_id, 
        p_stream_type, 
        p_event_data,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_start_time)) * 1000
    );
    
    -- Trigger real-time alerts if needed
    IF p_stream_type = 'cost_alert' THEN
        -- Process cost alerts
        PERFORM fn_trigger_cost_alert(p_tenant_id, p_event_data);
    ELSIF p_stream_type = 'performance_drop' THEN
        -- Process performance alerts
        PERFORM fn_trigger_performance_alert(p_tenant_id, p_event_data);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ml_models_tenant_status ON ml_models(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ml_models_type_accuracy ON ml_models(model_type, accuracy_score DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_stream_tenant_type ON analytics_stream(tenant_id, stream_type);
CREATE INDEX IF NOT EXISTS idx_analytics_stream_processed ON analytics_stream(processed_at);
CREATE INDEX IF NOT EXISTS idx_analytics_stream_tenant_time ON analytics_stream(tenant_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_marketplace_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_marketplace_keys(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active ON api_marketplace_keys(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_date ON api_usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_logs(endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_time_status ON api_usage_logs(created_at DESC, response_status);

-- Update existing analytics permissions for Phase 4
INSERT INTO permissions (name, resource, action, description, category, created_at) VALUES
('analytics:ml_models', 'analytics', 'ml_models', 'Access to ML models and training', 'analytics', CURRENT_TIMESTAMP),
('analytics:realtime', 'analytics', 'realtime', 'Access to real-time analytics streams', 'analytics', CURRENT_TIMESTAMP),
('analytics:api_marketplace', 'analytics', 'api_marketplace', 'Access to API marketplace features', 'analytics', CURRENT_TIMESTAMP),
('analytics:advanced', 'analytics', 'advanced', 'Access to advanced analytics features', 'analytics', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;