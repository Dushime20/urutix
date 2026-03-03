-- Broker Intelligence Features Migration
-- Created: 2026-01-13
-- Description: Creates tables for market intelligence, match recommendations, multi-stop loads, credit management, and performance tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

-- Broker match recommendation type
DO $$ BEGIN
  CREATE TYPE "broker_match_recommendation_type_enum" AS ENUM(
    'AI_POWERED',
    'ROUTE_OPTIMIZED',
    'BUNDLING_OPPORTUNITY',
    'BACKHAUL_IDENTIFIED',
    'COST_OPTIMIZED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Broker match status
DO $$ BEGIN
  CREATE TYPE "broker_match_status_enum" AS ENUM(
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Market rate type
DO $$ BEGIN
  CREATE TYPE "market_rate_type_enum" AS ENUM(
    'REAL_TIME',
    'HISTORICAL',
    'PREDICTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Credit status
DO $$ BEGIN
  CREATE TYPE "credit_status_enum" AS ENUM(
    'APPROVED',
    'PENDING',
    'REJECTED',
    'SUSPENDED',
    'REVIEW_REQUIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment term type
DO $$ BEGIN
  CREATE TYPE "payment_term_type_enum" AS ENUM(
    'NET_15',
    'NET_30',
    'NET_45',
    'NET_60',
    'DUE_ON_RECEIPT',
    'CUSTOM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================== BROKER MATCH RECOMMENDATIONS ====================

CREATE TABLE IF NOT EXISTS "broker_match_recommendations" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" character varying NOT NULL,
  "brokerId" character varying NOT NULL,
  "loadId" character varying NOT NULL,
  "transporterId" character varying,
  "truckId" character varying,
  "recommendationType" "broker_match_recommendation_type_enum" NOT NULL,
  "status" "broker_match_status_enum" NOT NULL DEFAULT 'PENDING',
  "matchScore" numeric(5,2) NOT NULL,
  "confidenceLevel" numeric(5,2) NOT NULL,
  "matchingFactors" jsonb NOT NULL,
  "routeOptimization" jsonb,
  "bundlingOpportunity" jsonb,
  "backhaulOpportunity" jsonb,
  "aiInsights" jsonb,
  "notes" text,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_match_recommendations" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_broker_load" 
ON "broker_match_recommendations" ("brokerId", "loadId");

CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_broker_status" 
ON "broker_match_recommendations" ("brokerId", "status");

CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_transporter_status" 
ON "broker_match_recommendations" ("transporterId", "status");

-- ==================== BROKER MARKET INTELLIGENCE ====================

CREATE TABLE IF NOT EXISTS "broker_market_intelligence" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" character varying NOT NULL,
  "brokerId" character varying NOT NULL,
  "rateType" "market_rate_type_enum" NOT NULL,
  "route" jsonb NOT NULL,
  "currentRate" numeric(12,2) NOT NULL,
  "averageRate" numeric(12,2),
  "medianRate" numeric(12,2),
  "minRate" numeric(12,2),
  "maxRate" numeric(12,2),
  "recommendedRate" numeric(12,2),
  "historicalTrends" jsonb,
  "demandForecast" jsonb,
  "rateRecommendations" jsonb,
  "marketFactors" jsonb,
  "pricingInsights" jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_market_intelligence" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_broker_route" 
ON "broker_market_intelligence" ("brokerId", "route");

CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_broker_created" 
ON "broker_market_intelligence" ("brokerId", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_route_type" 
ON "broker_market_intelligence" ("route", "rateType");

-- ==================== BROKER TRANSPORTER CREDIT ====================

CREATE TABLE IF NOT EXISTS "broker_transporter_credit" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" character varying NOT NULL,
  "brokerId" character varying NOT NULL,
  "transporterId" character varying NOT NULL,
  "status" "credit_status_enum" NOT NULL DEFAULT 'PENDING',
  "creditLimit" numeric(12,2) NOT NULL,
  "currentBalance" numeric(12,2) NOT NULL DEFAULT 0,
  "availableCredit" numeric(12,2) NOT NULL DEFAULT 0,
  "paymentTerms" "payment_term_type_enum" NOT NULL,
  "customPaymentDays" integer,
  "creditCheck" jsonb,
  "paymentHistory" jsonb,
  "riskAssessment" jsonb,
  "notes" text,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_transporter_credit" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_credit_broker_transporter" 
ON "broker_transporter_credit" ("brokerId", "transporterId");

CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_credit_transporter_status" 
ON "broker_transporter_credit" ("transporterId", "status");

-- ==================== BROKER MULTI-STOP LOADS ====================

CREATE TABLE IF NOT EXISTS "broker_multi_stop_loads" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" character varying NOT NULL,
  "brokerId" character varying NOT NULL,
  "loadId" character varying NOT NULL,
  "stops" jsonb NOT NULL,
  "optimizedRoute" jsonb,
  "routeOptimization" jsonb,
  "stopSequenceOptimization" jsonb,
  "notes" text,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_multi_stop_loads" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_broker_multi_stop_loads_broker_load" 
ON "broker_multi_stop_loads" ("brokerId", "loadId");

-- ==================== BROKER TRANSPORTER PERFORMANCE ====================

CREATE TABLE IF NOT EXISTS "broker_transporter_performance" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" character varying NOT NULL,
  "brokerId" character varying NOT NULL,
  "transporterId" character varying NOT NULL,
  "reliabilityScore" numeric(5,2) NOT NULL,
  "onTimeDeliveryRate" numeric(5,2) NOT NULL,
  "damageRate" numeric(5,2) NOT NULL,
  "predictiveMatchSuccess" numeric(5,2) NOT NULL,
  "reliabilityMetrics" jsonb NOT NULL,
  "onTimeTracking" jsonb NOT NULL,
  "damageAnalysis" jsonb NOT NULL,
  "predictiveMetrics" jsonb NOT NULL,
  "historicalTrends" jsonb,
  "comparativeAnalysis" jsonb,
  "calculatedAt" TIMESTAMP NOT NULL,
  "lastLoadDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_transporter_performance" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_performance_broker_transporter" 
ON "broker_transporter_performance" ("brokerId", "transporterId");

CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_performance_transporter_calculated" 
ON "broker_transporter_performance" ("transporterId", "calculatedAt");

-- ==================== COMMENTS ====================

COMMENT ON TABLE broker_match_recommendations IS 'AI-powered load-to-transporter matching recommendations';
COMMENT ON TABLE broker_market_intelligence IS 'Real-time market rates and pricing intelligence for routes';
COMMENT ON TABLE broker_transporter_credit IS 'Credit management and payment terms for transporters';
COMMENT ON TABLE broker_multi_stop_loads IS 'Manages loads with multiple pickup/delivery stops with route optimization';
COMMENT ON TABLE broker_transporter_performance IS 'Tracks transporter reliability, on-time delivery, and performance metrics';
