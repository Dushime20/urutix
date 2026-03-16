-- Migration: Cargo Owner Analytics Foundation
-- Description: Creates the foundational tables and indexes for the cargo owner analytics system
-- Version: 021
-- Date: 2026-03-16

-- Create cargo_owner_analytics table for aggregated shipment insights
CREATE TABLE cargo_owner_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    
    -- Route Analysis
    route_hash VARCHAR(64), -- For route grouping (MD5 hash of origin-destination)
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    distance_km DECIMAL(10,2),
    
    -- Cargo Details (from existing Load entity)
    cargo_type VARCHAR(50),
    cargo_weight_kg DECIMAL(10,2),
    cargo_volume_m3 DECIMAL(10,2),
    cargo_value DECIMAL(12,2),
    
    -- Financial Analysis
    total_cost DECIMAL(12,2),
    cost_per_km DECIMAL(8,2),
    cost_per_kg DECIMAL(8,4),
    profit_margin DECIMAL(5,2),
    
    -- Performance Metrics
    booking_date TIMESTAMPTZ,
    pickup_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    planned_transit_hours INTEGER,
    actual_transit_hours INTEGER,
    delay_hours INTEGER,
    on_time_delivery BOOLEAN DEFAULT FALSE,
    damage_reported BOOLEAN DEFAULT FALSE,
    
    -- Carrier Performance
    carrier_id UUID,
    carrier_rating DECIMAL(3,2),
    
    -- Market Context
    season VARCHAR(20), -- spring, summer, fall, winter
    market_conditions JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_insights table for AI-generated insights
CREATE TABLE analytics_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    insight_type VARCHAR(50) NOT NULL, -- cost_optimization, carrier_recommendation, route_analysis
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    potential_impact JSONB DEFAULT '{}', -- {cost_savings: 1000, time_reduction: 2}
    
    data_sources JSONB DEFAULT '{}', -- References to source data
    recommendations JSONB DEFAULT '{}', -- Actionable recommendations
    
    status VARCHAR(20) DEFAULT 'active', -- active, dismissed, implemented
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for cargo_owner_analytics
CREATE INDEX idx_cargo_analytics_tenant ON cargo_owner_analytics(tenant_id);
CREATE INDEX idx_cargo_analytics_owner ON cargo_owner_analytics(cargo_owner_id);
CREATE INDEX idx_cargo_analytics_load ON cargo_owner_analytics(load_id);
CREATE INDEX idx_cargo_analytics_route ON cargo_owner_analytics(route_hash);
CREATE INDEX idx_cargo_analytics_date ON cargo_owner_analytics(booking_date);
CREATE INDEX idx_cargo_analytics_tenant_owner ON cargo_owner_analytics(tenant_id, cargo_owner_id);
CREATE INDEX idx_cargo_analytics_carrier ON cargo_owner_analytics(carrier_id);
CREATE INDEX idx_cargo_analytics_season ON cargo_owner_analytics(season);

-- Create indexes for analytics_insights
CREATE INDEX idx_insights_tenant ON analytics_insights(tenant_id);
CREATE INDEX idx_insights_owner ON analytics_insights(cargo_owner_id);
CREATE INDEX idx_insights_type ON analytics_insights(insight_type);
CREATE INDEX idx_insights_status ON analytics_insights(status);
CREATE INDEX idx_insights_tenant_owner ON analytics_insights(tenant_id, cargo_owner_id);
CREATE INDEX idx_insights_expires ON analytics_insights(expires_at) WHERE expires_at IS NOT NULL;

-- Add analytics permissions to existing permissions table
INSERT INTO permissions (id, name, resource, action, description, created_at, updated_at, category) VALUES
(gen_random_uuid(), 'analytics:view', 'analytics', 'view', 'View analytics dashboards and reports', NOW(), NOW(), 'analytics'),
(gen_random_uuid(), 'analytics:export', 'analytics', 'export', 'Export analytics data and reports', NOW(), NOW(), 'analytics'),
(gen_random_uuid(), 'analytics:insights', 'analytics', 'insights', 'Access AI-generated insights and recommendations', NOW(), NOW(), 'analytics'),
(gen_random_uuid(), 'analytics:admin', 'analytics', 'admin', 'Manage analytics settings and configurations', NOW(), NOW(), 'analytics')
ON CONFLICT (name) DO NOTHING;

-- Add analytics pricing rules to credit_pricing_rules
INSERT INTO credit_pricing_rules (
    id, rule_name, rule_type, credit_cost, unit, 
    is_active, priority, created_at, updated_at
) 
SELECT 
    gen_random_uuid(), 
    'Analytics Dashboard View', 
    'flat', 
    0.1, 
    'per_view', 
    true, 
    100, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM credit_pricing_rules WHERE rule_name = 'Analytics Dashboard View'
)
UNION ALL
SELECT 
    gen_random_uuid(), 
    'AI Insights Generation', 
    'flat', 
    1.0, 
    'per_insight', 
    true, 
    100, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM credit_pricing_rules WHERE rule_name = 'AI Insights Generation'
)
UNION ALL
SELECT 
    gen_random_uuid(), 
    'Analytics Data Export', 
    'flat', 
    0.5, 
    'per_export', 
    true, 
    100, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM credit_pricing_rules WHERE rule_name = 'Analytics Data Export'
);

-- Create function to automatically update route_hash
CREATE OR REPLACE FUNCTION update_route_hash()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate MD5 hash of origin-destination for route grouping
    NEW.route_hash = MD5(COALESCE(NEW.origin_city, '') || '-' || COALESCE(NEW.destination_city, ''));
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update route_hash
CREATE TRIGGER trigger_update_route_hash
    BEFORE INSERT OR UPDATE ON cargo_owner_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_route_hash();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_cargo_analytics_updated_at
    BEFORE UPDATE ON cargo_owner_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trigger_insights_updated_at
    BEFORE UPDATE ON analytics_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- Add comments for documentation
COMMENT ON TABLE cargo_owner_analytics IS 'Aggregated analytics data for cargo owner shipments';
COMMENT ON TABLE analytics_insights IS 'AI-generated insights and recommendations for cargo owners';
COMMENT ON COLUMN cargo_owner_analytics.route_hash IS 'MD5 hash of origin-destination for route grouping';
COMMENT ON COLUMN analytics_insights.confidence_score IS 'AI confidence score between 0 and 1';
COMMENT ON COLUMN analytics_insights.potential_impact IS 'JSON object containing potential cost savings, time reduction, etc.';