-- Migration: 023_operational_analytics.sql
-- Phase 2: Operational Analytics & Intelligence
-- Adds carrier performance metrics, route analytics, and market intelligence tables

-- Carrier Performance Metrics Table
CREATE TABLE IF NOT EXISTS carrier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_period DATE NOT NULL,
    
    -- Performance Metrics
    total_shipments INTEGER DEFAULT 0,
    on_time_rate DECIMAL(5,2) DEFAULT 0.00,
    damage_rate DECIMAL(5,2) DEFAULT 0.00,
    average_cost_per_km DECIMAL(8,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Calculated Scores
    reliability_score DECIMAL(5,2) DEFAULT 0.00,
    cost_competitiveness_score DECIMAL(5,2) DEFAULT 0.00,
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    recommendation_level VARCHAR(20) DEFAULT 'acceptable', -- preferred, acceptable, avoid
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for carrier performance metrics
CREATE INDEX idx_carrier_metrics_tenant ON carrier_performance_metrics(tenant_id);
CREATE INDEX idx_carrier_metrics_carrier ON carrier_performance_metrics(carrier_id);
CREATE INDEX idx_carrier_metrics_cargo_owner ON carrier_performance_metrics(cargo_owner_id);
CREATE INDEX idx_carrier_metrics_period ON carrier_performance_metrics(evaluation_period);
CREATE INDEX idx_carrier_metrics_recommendation ON carrier_performance_metrics(recommendation_level);
-- Unique constraint required for ON CONFLICT upsert in trigger function
CREATE UNIQUE INDEX IF NOT EXISTS uq_carrier_metrics_tenant_carrier_owner_period
  ON carrier_performance_metrics(tenant_id, carrier_id, cargo_owner_id, evaluation_period);

-- Route Analytics Table
CREATE TABLE IF NOT EXISTS route_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_hash VARCHAR(64) NOT NULL,
    
    -- Route Details
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    distance_km DECIMAL(10,2),
    evaluation_period DATE NOT NULL,
    
    -- Performance Metrics
    total_shipments INTEGER DEFAULT 0,
    average_cost DECIMAL(12,2) DEFAULT 0.00,
    cost_trend DECIMAL(5,2) DEFAULT 0.00, -- % change from previous period
    average_transit_time INTEGER DEFAULT 0, -- hours
    on_time_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Carrier Intelligence
    preferred_carriers UUID[], -- Array of carrier IDs
    carrier_count INTEGER DEFAULT 0,
    
    -- Market Analysis
    seasonal_patterns JSONB,
    demand_level VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    profitability_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for route analytics
CREATE INDEX idx_route_analytics_tenant ON route_analytics(tenant_id);
CREATE INDEX idx_route_analytics_cargo_owner ON route_analytics(cargo_owner_id);
CREATE INDEX idx_route_analytics_route ON route_analytics(route_hash);
CREATE INDEX idx_route_analytics_period ON route_analytics(evaluation_period);
CREATE INDEX idx_route_analytics_demand ON route_analytics(demand_level);

-- Market Intelligence Data Table
CREATE TABLE IF NOT EXISTS market_intelligence_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50) NOT NULL, -- pricing, demand, capacity, trends
    geographic_scope VARCHAR(100) NOT NULL, -- city, region, country
    time_period DATE NOT NULL,
    cargo_type VARCHAR(50),
    
    -- Flexible metrics structure
    metrics JSONB NOT NULL,
    
    -- Data Quality
    source VARCHAR(100),
    confidence_score DECIMAL(3,2) DEFAULT 0.50,
    participant_count INTEGER DEFAULT 0, -- For anonymity protection
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for market intelligence
CREATE INDEX idx_market_intelligence_type ON market_intelligence_data(data_type);
CREATE INDEX idx_market_intelligence_geo ON market_intelligence_data(geographic_scope);
CREATE INDEX idx_market_intelligence_period ON market_intelligence_data(time_period);
CREATE INDEX idx_market_intelligence_cargo ON market_intelligence_data(cargo_type);
CREATE INDEX idx_market_intelligence_source ON market_intelligence_data(source);

-- Operational Performance Snapshots Table
CREATE TABLE IF NOT EXISTS operational_performance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    
    -- Overall Performance Metrics
    total_active_routes INTEGER DEFAULT 0,
    total_active_carriers INTEGER DEFAULT 0,
    average_delivery_time DECIMAL(8,2) DEFAULT 0.00, -- hours
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    damage_incident_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Cost Efficiency
    cost_per_km_trend DECIMAL(5,2) DEFAULT 0.00,
    cost_per_kg_trend DECIMAL(5,2) DEFAULT 0.00,
    cost_optimization_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Carrier Relationship Health
    preferred_carrier_usage_rate DECIMAL(5,2) DEFAULT 0.00,
    carrier_diversification_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Route Optimization
    route_efficiency_score DECIMAL(5,2) DEFAULT 0.00,
    seasonal_adaptation_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for operational performance snapshots
CREATE INDEX idx_ops_snapshots_tenant ON operational_performance_snapshots(tenant_id);
CREATE INDEX idx_ops_snapshots_cargo_owner ON operational_performance_snapshots(cargo_owner_id);
CREATE INDEX idx_ops_snapshots_date ON operational_performance_snapshots(snapshot_date);

-- Add operational fields to existing cargo_owner_analytics table
ALTER TABLE cargo_owner_analytics ADD COLUMN IF NOT EXISTS carrier_performance_score DECIMAL(5,2);
ALTER TABLE cargo_owner_analytics ADD COLUMN IF NOT EXISTS route_efficiency_score DECIMAL(5,2);
ALTER TABLE cargo_owner_analytics ADD COLUMN IF NOT EXISTS weather_impact_factor DECIMAL(3,2);
ALTER TABLE cargo_owner_analytics ADD COLUMN IF NOT EXISTS traffic_delay_minutes INTEGER;

-- Create indexes for new operational fields
CREATE INDEX IF NOT EXISTS idx_cargo_analytics_carrier_performance ON cargo_owner_analytics(carrier_performance_score);
CREATE INDEX IF NOT EXISTS idx_cargo_analytics_route_efficiency ON cargo_owner_analytics(route_efficiency_score);

-- Update analytics insights table with operational insight types
ALTER TABLE analytics_insights ADD COLUMN IF NOT EXISTS operational_context JSONB;

-- Add check constraints for data quality
ALTER TABLE carrier_performance_metrics ADD CONSTRAINT chk_carrier_metrics_rates 
    CHECK (on_time_rate >= 0 AND on_time_rate <= 100 AND damage_rate >= 0 AND damage_rate <= 100);

ALTER TABLE route_analytics ADD CONSTRAINT chk_route_analytics_rates 
    CHECK (on_time_rate >= 0 AND on_time_rate <= 100 AND profitability_score >= 0);

ALTER TABLE operational_performance_snapshots ADD CONSTRAINT chk_ops_snapshots_rates 
    CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100 AND damage_incident_rate >= 0 AND damage_incident_rate <= 100);

-- Create function to update carrier performance metrics
CREATE OR REPLACE FUNCTION update_carrier_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called when analytics data is updated
    -- to automatically recalculate carrier performance metrics
    
    -- Update carrier metrics for the affected carrier
    INSERT INTO carrier_performance_metrics (
        tenant_id, carrier_id, cargo_owner_id, evaluation_period,
        total_shipments, on_time_rate, average_cost_per_km, overall_score
    )
    SELECT 
        NEW.tenant_id,
        NEW.carrier_id,
        NEW.cargo_owner_id,
        DATE_TRUNC('month', NEW.booking_date)::DATE,
        COUNT(*),
        AVG(CASE WHEN on_time_delivery THEN 100 ELSE 0 END),
        AVG(cost_per_km),
        AVG(COALESCE(carrier_rating, 3.0)) * 20 -- Convert 5-point scale to 100-point
    FROM cargo_owner_analytics
    WHERE tenant_id = NEW.tenant_id 
      AND carrier_id = NEW.carrier_id 
      AND cargo_owner_id = NEW.cargo_owner_id
      AND DATE_TRUNC('month', booking_date) = DATE_TRUNC('month', NEW.booking_date)
    GROUP BY tenant_id, carrier_id, cargo_owner_id, DATE_TRUNC('month', booking_date)
    ON CONFLICT (tenant_id, carrier_id, cargo_owner_id, evaluation_period) 
    DO UPDATE SET
        total_shipments = EXCLUDED.total_shipments,
        on_time_rate = EXCLUDED.on_time_rate,
        average_cost_per_km = EXCLUDED.average_cost_per_km,
        overall_score = EXCLUDED.overall_score,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic carrier performance updates
DROP TRIGGER IF EXISTS trigger_update_carrier_performance ON cargo_owner_analytics;
CREATE TRIGGER trigger_update_carrier_performance
    AFTER INSERT OR UPDATE ON cargo_owner_analytics
    FOR EACH ROW
    WHEN (NEW.carrier_id IS NOT NULL)
    EXECUTE FUNCTION update_carrier_performance_metrics();

-- Insert sample market intelligence data for testing
INSERT INTO market_intelligence_data (data_type, geographic_scope, time_period, cargo_type, metrics, source, confidence_score, participant_count) VALUES
('pricing', 'Lagos-Abuja', CURRENT_DATE - INTERVAL '1 month', 'general', 
 '{"average_rate_per_km": 45.50, "rate_range": {"min": 35.00, "max": 60.00}, "trend": "stable"}', 
 'market_analysis', 0.75, 15),
('demand', 'Lagos-Port Harcourt', CURRENT_DATE - INTERVAL '1 month', 'oil_gas', 
 '{"demand_level": "high", "capacity_utilization": 85, "peak_seasons": ["Q4", "Q1"]}', 
 'market_analysis', 0.80, 12),
('capacity', 'Kano-Lagos', CURRENT_DATE - INTERVAL '1 month', 'agriculture', 
 '{"available_capacity": 75, "carrier_count": 8, "average_lead_time": 48}', 
 'market_analysis', 0.70, 10);

-- Create view for operational analytics dashboard
CREATE OR REPLACE VIEW operational_analytics_dashboard AS
SELECT 
    coa.tenant_id,
    coa.cargo_owner_id,
    COUNT(*) as total_shipments,
    AVG(coa.on_time_delivery::int * 100) as on_time_rate,
    AVG(coa.damage_reported::int * 100) as damage_rate,
    AVG(coa.cost_per_km) as avg_cost_per_km,
    AVG(coa.actual_transit_hours) as avg_transit_hours,
    COUNT(DISTINCT coa.carrier_id) as active_carriers,
    COUNT(DISTINCT coa.route_hash) as active_routes,
    AVG(coa.carrier_rating) as avg_carrier_rating
FROM cargo_owner_analytics coa
WHERE coa.booking_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY coa.tenant_id, coa.cargo_owner_id;

-- Grant permissions (skipped — role urutix_app is not guaranteed to exist)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON carrier_performance_metrics TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON route_analytics TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON market_intelligence_data TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON operational_performance_snapshots TO urutix_app;
-- GRANT SELECT ON operational_analytics_dashboard TO urutix_app;

-- Add comments for documentation
COMMENT ON TABLE carrier_performance_metrics IS 'Stores calculated performance metrics for carriers by cargo owner and time period';
COMMENT ON TABLE route_analytics IS 'Aggregated analytics for specific routes including cost trends and performance metrics';
COMMENT ON TABLE market_intelligence_data IS 'Market intelligence data for benchmarking and competitive analysis';
COMMENT ON TABLE operational_performance_snapshots IS 'Daily snapshots of overall operational performance metrics';
COMMENT ON VIEW operational_analytics_dashboard IS 'Real-time view of operational metrics for dashboard display';