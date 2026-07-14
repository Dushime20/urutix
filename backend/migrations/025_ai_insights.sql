-- Migration: 025_ai_insights.sql
-- Phase 3: AI Insights & Predictive Analytics
-- Adds predictive insights, AI recommendations, and alert management tables

-- Predictive Insights Table
CREATE TABLE predictive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Insight Classification
    insight_type VARCHAR(50) NOT NULL, -- cost_forecast, demand_prediction, risk_alert, optimization_opportunity
    target_entity VARCHAR(50) NOT NULL, -- route, carrier, market, shipment
    target_id VARCHAR(255), -- ID of the target entity
    
    -- Prediction Details
    prediction_horizon INTEGER NOT NULL, -- days into future
    predicted_value DECIMAL(15,4),
    confidence_interval JSONB, -- {lower: x, upper: y}
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    
    -- Model Information
    model_version VARCHAR(20) DEFAULT 'v1.0',
    model_type VARCHAR(50) DEFAULT 'statistical', -- statistical, ml, ai, hybrid
    input_features JSONB, -- Features used for prediction
    
    -- Prediction Context
    baseline_value DECIMAL(15,4), -- Current/historical value for comparison
    prediction_change DECIMAL(5,2), -- Percentage change from baseline
    impact_assessment JSONB, -- Business impact analysis
    
    -- Validity and Status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, superseded, dismissed
    accuracy_score DECIMAL(3,2), -- Actual vs predicted accuracy (populated later)
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for predictive insights
CREATE INDEX idx_predictive_insights_tenant ON predictive_insights(tenant_id);
CREATE INDEX idx_predictive_insights_cargo_owner ON predictive_insights(cargo_owner_id);
CREATE INDEX idx_predictive_insights_type ON predictive_insights(insight_type);
CREATE INDEX idx_predictive_insights_target ON predictive_insights(target_entity, target_id);
CREATE INDEX idx_predictive_insights_valid ON predictive_insights(valid_until);
CREATE INDEX idx_predictive_insights_status ON predictive_insights(status);
CREATE INDEX idx_predictive_insights_confidence ON predictive_insights(confidence_score);

-- AI Recommendations Table
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation Details
    recommendation_type VARCHAR(50) NOT NULL, -- cost_optimization, carrier_selection, route_planning, risk_mitigation
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    -- AI Analysis
    ai_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    reasoning TEXT, -- AI-generated explanation
    supporting_data JSONB, -- Data points that support the recommendation
    
    -- Business Impact
    potential_savings DECIMAL(12,2),
    potential_time_savings INTEGER, -- in hours
    risk_reduction_score DECIMAL(3,2),
    implementation_effort VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    
    -- Actionable Steps
    action_items JSONB, -- Array of specific actions to take
    estimated_timeline VARCHAR(50), -- Implementation timeline
    success_metrics JSONB, -- How to measure success
    
    -- Recommendation Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, implemented, expired
    user_feedback JSONB, -- User rating and comments
    implementation_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for AI recommendations
CREATE INDEX idx_ai_recommendations_tenant ON ai_recommendations(tenant_id);
CREATE INDEX idx_ai_recommendations_cargo_owner ON ai_recommendations(cargo_owner_id);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_confidence ON ai_recommendations(ai_confidence);

-- Alert Management Table
CREATE TABLE analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert Configuration
    alert_type VARCHAR(50) NOT NULL, -- cost_spike, performance_drop, anomaly_detected, threshold_breach
    alert_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger Conditions
    metric_name VARCHAR(100) NOT NULL, -- cost_per_km, on_time_rate, carrier_rating, etc.
    threshold_value DECIMAL(15,4),
    threshold_operator VARCHAR(10) NOT NULL, -- >, <, >=, <=, =, !=
    comparison_period INTEGER DEFAULT 30, -- days to compare against
    
    -- Alert Settings
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    is_active BOOLEAN DEFAULT true,
    notification_channels JSONB, -- email, sms, in_app, webhook
    frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly
    
    -- Alert History
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    last_value DECIMAL(15,4), -- Last metric value that triggered alert
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Indexes for analytics alerts
CREATE INDEX idx_analytics_alerts_tenant ON analytics_alerts(tenant_id);
CREATE INDEX idx_analytics_alerts_cargo_owner ON analytics_alerts(cargo_owner_id);
CREATE INDEX idx_analytics_alerts_type ON analytics_alerts(alert_type);
CREATE INDEX idx_analytics_alerts_active ON analytics_alerts(is_active);
CREATE INDEX idx_analytics_alerts_severity ON analytics_alerts(severity);

-- Alert Triggers Log Table
CREATE TABLE alert_triggers_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES analytics_alerts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Trigger Details
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    metric_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    deviation_percentage DECIMAL(5,2),
    
    -- Context
    trigger_context JSONB, -- Additional context about what caused the trigger
    affected_entities JSONB, -- Routes, carriers, shipments affected
    
    -- Response
    notification_sent BOOLEAN DEFAULT false,
    notification_channels JSONB,
    user_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Indexes for alert triggers log
CREATE INDEX idx_alert_triggers_alert ON alert_triggers_log(alert_id);
CREATE INDEX idx_alert_triggers_tenant ON alert_triggers_log(tenant_id);
CREATE INDEX idx_alert_triggers_date ON alert_triggers_log(triggered_at);
CREATE INDEX idx_alert_triggers_resolved ON alert_triggers_log(resolved);

-- AI Model Performance Tracking Table
CREATE TABLE ai_model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    
    -- Performance Metrics
    evaluation_date DATE NOT NULL,
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    
    -- Prediction Quality
    mean_absolute_error DECIMAL(10,4),
    root_mean_square_error DECIMAL(10,4),
    prediction_count INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    
    -- Business Metrics
    cost_savings_achieved DECIMAL(12,2),
    recommendations_accepted INTEGER DEFAULT 0,
    recommendations_total INTEGER DEFAULT 0,
    user_satisfaction_score DECIMAL(3,2),
    
    -- Model Details
    training_data_size INTEGER,
    feature_count INTEGER,
    model_complexity_score DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for AI model performance
CREATE INDEX idx_ai_model_performance_name ON ai_model_performance(model_name);
CREATE INDEX idx_ai_model_performance_version ON ai_model_performance(model_version);
CREATE INDEX idx_ai_model_performance_date ON ai_model_performance(evaluation_date);

-- Enhance existing analytics_insights table with AI fields
ALTER TABLE analytics_insights ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE analytics_insights ADD COLUMN IF NOT EXISTS model_version VARCHAR(20);
ALTER TABLE analytics_insights ADD COLUMN IF NOT EXISTS prediction_accuracy DECIMAL(3,2);
ALTER TABLE analytics_insights ADD COLUMN IF NOT EXISTS learning_feedback JSONB;

-- Create function to automatically expire old predictions
CREATE OR REPLACE FUNCTION expire_old_predictions()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark predictions as expired when they pass their valid_until date
    UPDATE predictive_insights 
    SET status = 'expired', updated_at = NOW()
    WHERE valid_until < NOW() AND status = 'active';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run expiration check daily
CREATE OR REPLACE FUNCTION schedule_prediction_expiry()
RETURNS void AS $$
BEGIN
    -- This would be called by a scheduled job
    PERFORM expire_old_predictions();
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate prediction accuracy
CREATE OR REPLACE FUNCTION update_prediction_accuracy(
    prediction_id UUID,
    actual_value DECIMAL(15,4)
)
RETURNS void AS $$
DECLARE
    predicted_val DECIMAL(15,4);
    accuracy DECIMAL(3,2);
BEGIN
    -- Get the predicted value
    SELECT predicted_value INTO predicted_val
    FROM predictive_insights
    WHERE id = prediction_id;
    
    -- Calculate accuracy (1 - |actual - predicted| / |actual|)
    IF actual_value != 0 THEN
        accuracy = GREATEST(0, 1 - ABS(actual_value - predicted_val) / ABS(actual_value));
    ELSE
        accuracy = CASE WHEN predicted_val = 0 THEN 1.0 ELSE 0.0 END;
    END IF;
    
    -- Update the prediction with accuracy
    UPDATE predictive_insights
    SET accuracy_score = accuracy, updated_at = NOW()
    WHERE id = prediction_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data inserts are skipped on fresh databases (no tenants/users yet).
-- They will be populated by the application seed scripts after startup.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM tenants LIMIT 1) AND EXISTS (SELECT 1 FROM users WHERE role = 'CARGO_OWNER' LIMIT 1) THEN
    INSERT INTO predictive_insights (
        tenant_id, cargo_owner_id, insight_type, target_entity, target_id,
        prediction_horizon, predicted_value, confidence_score, model_version,
        baseline_value, prediction_change, valid_until
    ) VALUES
    ((SELECT id FROM tenants LIMIT 1), 
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'cost_forecast', 'route', 'lagos-abuja-route',
     30, 125000.00, 0.85, 'v1.2',
     120000.00, 4.17, NOW() + INTERVAL '30 days'),
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'demand_prediction', 'market', 'oil_gas_sector',
     60, 1.25, 0.78, 'v1.2',
     1.00, 25.00, NOW() + INTERVAL '60 days'),
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'risk_alert', 'carrier', 'carrier-xyz-123',
     14, 0.72, 0.92, 'v1.2',
     0.85, -15.29, NOW() + INTERVAL '14 days');

    INSERT INTO ai_recommendations (
        tenant_id, cargo_owner_id, recommendation_type, title, description,
        priority, ai_confidence, reasoning, potential_savings, implementation_effort,
        action_items, estimated_timeline, expires_at
    ) VALUES
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'cost_optimization', 'Switch to Alternative Route for Lagos-Abuja Shipments',
     'Analysis shows 15% cost savings by using alternative carriers on this route',
     'high', 0.87, 'Historical data indicates consistent 15-20% savings with Carrier B vs current Carrier A',
     45000.00, 'low',
     '[{"action": "Contact Carrier B for capacity", "priority": 1}, {"action": "Negotiate volume discount", "priority": 2}]',
     '1-2 weeks', NOW() + INTERVAL '30 days'),
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'carrier_selection', 'Diversify Carrier Portfolio for Risk Reduction',
     'Current 80% dependency on single carrier creates operational risk',
     'medium', 0.75, 'Risk analysis shows high concentration risk with current carrier mix',
     25000.00, 'medium',
     '[{"action": "Identify 2-3 backup carriers", "priority": 1}, {"action": "Test with small shipments", "priority": 2}]',
     '3-4 weeks', NOW() + INTERVAL '45 days');

    INSERT INTO analytics_alerts (
        tenant_id, cargo_owner_id, alert_type, alert_name, description,
        metric_name, threshold_value, threshold_operator, severity, notification_channels
    ) VALUES
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'cost_spike', 'High Cost Per KM Alert',
     'Alert when cost per km exceeds 20% above average',
     'cost_per_km', 50.00, '>', 'high', '["email", "in_app"]'),
    ((SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1),
     'performance_drop', 'On-Time Delivery Drop',
     'Alert when on-time delivery rate drops below 85%',
     'on_time_rate', 85.00, '<', 'medium', '["email", "in_app"]');
  END IF;
END $$;

-- Create views for AI insights dashboard
CREATE OR REPLACE VIEW ai_insights_dashboard AS
SELECT 
    pi.tenant_id,
    pi.cargo_owner_id,
    COUNT(*) as total_predictions,
    AVG(pi.confidence_score) as avg_confidence,
    COUNT(CASE WHEN pi.status = 'active' THEN 1 END) as active_predictions,
    COUNT(CASE WHEN pi.accuracy_score >= 0.8 THEN 1 END) as high_accuracy_predictions,
    AVG(pi.accuracy_score) as avg_accuracy,
    COUNT(DISTINCT pi.insight_type) as insight_types_count
FROM predictive_insights pi
WHERE pi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pi.tenant_id, pi.cargo_owner_id;

CREATE OR REPLACE VIEW recommendations_summary AS
SELECT 
    ar.tenant_id,
    ar.cargo_owner_id,
    COUNT(*) as total_recommendations,
    COUNT(CASE WHEN ar.status = 'pending' THEN 1 END) as pending_recommendations,
    COUNT(CASE WHEN ar.status = 'implemented' THEN 1 END) as implemented_recommendations,
    SUM(ar.potential_savings) as total_potential_savings,
    AVG(ar.ai_confidence) as avg_confidence
FROM ai_recommendations ar
WHERE ar.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ar.tenant_id, ar.cargo_owner_id;

-- Grant permissions (skipped — role urutix_app is not guaranteed to exist)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON predictive_insights TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ai_recommendations TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_alerts TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alert_triggers_log TO urutix_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ai_model_performance TO urutix_app;
-- GRANT SELECT ON ai_insights_dashboard TO urutix_app;
-- GRANT SELECT ON recommendations_summary TO urutix_app;

-- Add comments for documentation
COMMENT ON TABLE predictive_insights IS 'AI-generated predictions for costs, demand, and risks with confidence intervals';
COMMENT ON TABLE ai_recommendations IS 'AI-powered actionable recommendations for optimization and improvement';
COMMENT ON TABLE analytics_alerts IS 'User-configurable alerts for monitoring key metrics and thresholds';
COMMENT ON TABLE alert_triggers_log IS 'Historical log of alert triggers and user responses';
COMMENT ON TABLE ai_model_performance IS 'Performance tracking and evaluation metrics for AI models';
COMMENT ON VIEW ai_insights_dashboard IS 'Summary view of AI insights performance for dashboard display';
COMMENT ON VIEW recommendations_summary IS 'Summary view of AI recommendations status and impact';