-- Load Management Migration Script
-- Run this script manually in your PostgreSQL database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('BOL', 'POD', 'Invoice', 'Customs', 'Other')),
    filename VARCHAR(255) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    "uploadedBy" UUID NOT NULL,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verifiedAt" TIMESTAMP WITH TIME ZONE,
    "verifiedBy" UUID,
    "verificationNotes" TEXT,
    "isPublic" BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Location', 'GeofenceEnter', 'GeofenceExit', 'Delay', 'Incident', 'StatusChange', 'DocumentUpload', 'Alert')),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    "speedKph" DECIMAL(5,2),
    "headingDeg" DECIMAL(5,2),
    "accuracyM" DECIMAL(5,2),
    altitude DECIMAL(5,2),
    "altitudeAccuracy" DECIMAL(5,2),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    "postalCode" TEXT,
    "geofenceId" TEXT,
    "geofenceType" VARCHAR(20) CHECK ("geofenceType" IN ('pickup', 'delivery', 'custom', 'restricted')),
    "geofenceName" TEXT,
    data JSONB DEFAULT '{}',
    description TEXT,
    notes TEXT,
    "reportedBy" UUID,
    "isAutomated" BOOLEAN DEFAULT FALSE,
    "requiresAction" BOOLEAN DEFAULT FALSE,
    "actionTakenAt" TIMESTAMP WITH TIME ZONE,
    "actionTakenBy" UUID,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Delay', 'RouteDeviation', 'Incident', 'TemperatureExcursion', 'CustomsHold', 'MechanicalIssue', 'WeatherDelay', 'TrafficDelay', 'SecurityIssue', 'Other')),
    description TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "acknowledgedAt" TIMESTAMP WITH TIME ZONE,
    "acknowledgedBy" UUID,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "resolvedBy" UUID,
    "closedAt" TIMESTAMP WITH TIME ZONE,
    "closedBy" UUID,
    "resolutionNotes" TEXT,
    "actionTaken" TEXT,
    metadata JSONB DEFAULT '{}',
    location JSONB,
    "estimatedDelayHours" DECIMAL(5,2),
    "estimatedResolutionTime" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "requiresImmediateAction" BOOLEAN DEFAULT FALSE,
    "isEscalated" BOOLEAN DEFAULT FALSE,
    "escalatedAt" TIMESTAMP WITH TIME ZONE,
    "escalatedTo" UUID,
    "escalationReason" TEXT,
    attachments JSONB,
    "externalReference" TEXT,
    "externalSystem" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    "entityType" VARCHAR(20) NOT NULL DEFAULT 'load' CHECK ("entityType" IN ('load', 'document', 'tracking', 'alert', 'bid', 'trip')),
    "entityId" UUID,
    action VARCHAR(30) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'assign', 'start', 'deliver', 'cancel', 'repost', 'status_change', 'document_upload', 'document_delete', 'location_update', 'pricing_update', 'alert_create', 'alert_update', 'tracking_update', 'bulk_operation')),
    "actorId" UUID NOT NULL,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    description TEXT,
    reason TEXT,
    before JSONB,
    after JSONB,
    changes JSONB,
    metadata JSONB DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "externalReference" TEXT,
    "externalSystem" TEXT,
    "isAutomated" BOOLEAN DEFAULT FALSE,
    "automationSource" TEXT,
    "relatedEntities" JSONB,
    notes TEXT,
    tags TEXT[],
    "isSensitive" BOOLEAN DEFAULT FALSE,
    "requiresReview" BOOLEAN DEFAULT FALSE,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP WITH TIME ZONE,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Create price_suggestions table
CREATE TABLE IF NOT EXISTS price_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    "pricingModel" VARCHAR(20) NOT NULL DEFAULT 'market_rate' CHECK ("pricingModel" IN ('market_rate', 'distance_based', 'weight_based', 'volume_based', 'time_based', 'demand_based', 'competitive', 'custom')),
    "suggestedAmount" DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    confidence DECIMAL(3,2) NOT NULL,
    "confidenceLevel" VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK ("confidenceLevel" IN ('low', 'medium', 'high', 'very_high')),
    status VARCHAR(15) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'accepted', 'rejected', 'superseded')),
    "minAmount" DECIMAL(15,2),
    "maxAmount" DECIMAL(15,2),
    "baseRate" DECIMAL(15,2),
    "fuelSurcharge" DECIMAL(15,2),
    accessorials DECIMAL(15,2),
    taxes DECIMAL(15,2),
    insurance DECIMAL(15,2),
    markup DECIMAL(15,2),
    discount DECIMAL(15,2),
    "distanceMiles" DECIMAL(10,2),
    "distanceKm" DECIMAL(10,2),
    "estimatedHours" DECIMAL(10,2),
    tolls DECIMAL(10,2),
    parking DECIMAL(10,2),
    "marketDemand" DECIMAL(5,2),
    "capacityUtilization" DECIMAL(5,2),
    "fuelPrice" DECIMAL(5,2),
    "seasonalFactor" DECIMAL(5,2),
    "competitorLow" DECIMAL(15,2),
    "competitorHigh" DECIMAL(15,2),
    "competitorAverage" DECIMAL(15,2),
    "competitorCount" INTEGER,
    "weightFactor" DECIMAL(10,2),
    "volumeFactor" DECIMAL(10,2),
    "urgencyFactor" DECIMAL(10,2),
    "specialHandlingFactor" DECIMAL(10,2),
    "hazmatFactor" DECIMAL(10,2),
    "temperatureFactor" DECIMAL(10,2),
    inputs JSONB,
    "calculationSteps" JSONB,
    "marketData" JSONB,
    notes TEXT,
    reasoning TEXT,
    assumptions TEXT,
    limitations TEXT,
    recommendations TEXT,
    "validFrom" TIMESTAMP WITH TIME ZONE,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    "acceptedAt" TIMESTAMP WITH TIME ZONE,
    "acceptedBy" UUID,
    "rejectedAt" TIMESTAMP WITH TIME ZONE,
    "rejectedBy" UUID,
    "rejectionReason" TEXT,
    metadata JSONB DEFAULT '{}',
    "externalReference" TEXT,
    "externalSystem" TEXT,
    "isAutomated" BOOLEAN DEFAULT FALSE,
    "automationSource" TEXT,
    "processingTimeMs" DECIMAL(5,2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Add new columns to loads table (only if they don't exist)
DO $$
BEGIN
    -- Add reference column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'reference') THEN
        ALTER TABLE loads ADD COLUMN reference VARCHAR(255);
    END IF;
    
    -- Add loadType column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'loadType') THEN
        ALTER TABLE loads ADD COLUMN "loadType" VARCHAR(20) DEFAULT 'FTL' CHECK ("loadType" IN ('FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER'));
    END IF;
    
    -- Add equipmentType column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'equipmentType') THEN
        ALTER TABLE loads ADD COLUMN "equipmentType" VARCHAR(20) DEFAULT 'DRY_VAN' CHECK ("equipmentType" IN ('DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'CONTAINER', 'OTHER'));
    END IF;
    
    -- Add visibility column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'visibility') THEN
        ALTER TABLE loads ADD COLUMN visibility VARCHAR(10) DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
    END IF;
    
    -- Add unitsRequired column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'unitsRequired') THEN
        ALTER TABLE loads ADD COLUMN "unitsRequired" INTEGER DEFAULT 1;
    END IF;
    
    -- Add origin column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'origin') THEN
        ALTER TABLE loads ADD COLUMN origin JSONB;
    END IF;
    
    -- Add destination column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'destination') THEN
        ALTER TABLE loads ADD COLUMN destination JSONB;
    END IF;
    
    -- Add pickupWindow column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'pickupWindow') THEN
        ALTER TABLE loads ADD COLUMN "pickupWindow" JSONB;
    END IF;
    
    -- Add deliveryWindow column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'deliveryWindow') THEN
        ALTER TABLE loads ADD COLUMN "deliveryWindow" JSONB;
    END IF;
    
    -- Add pricing column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'pricing') THEN
        ALTER TABLE loads ADD COLUMN pricing JSONB;
    END IF;
    
    -- Add paymentTerms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'paymentTerms') THEN
        ALTER TABLE loads ADD COLUMN "paymentTerms" VARCHAR(10) DEFAULT 'Net30' CHECK ("paymentTerms" IN ('Prepaid', 'OnDelivery', 'Net15', 'Net30', 'Net45', 'Net60'));
    END IF;
    
    -- Add invitedCarriers column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'invitedCarriers') THEN
        ALTER TABLE loads ADD COLUMN "invitedCarriers" TEXT[];
    END IF;
    
    -- Add assignedCarrierId column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'assignedCarrierId') THEN
        ALTER TABLE loads ADD COLUMN "assignedCarrierId" UUID;
    END IF;
    
    -- Add packagingType column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'packagingType') THEN
        ALTER TABLE loads ADD COLUMN "packagingType" VARCHAR(20) DEFAULT 'Palletized' CHECK ("packagingType" IN ('Palletized', 'Loose', 'Containerized', 'Crate', 'Drum', 'Other'));
    END IF;
    
    -- Add metadata column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'metadata') THEN
        ALTER TABLE loads ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_DOCUMENTS_LOAD_ID" ON documents ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_DOCUMENTS_TYPE" ON documents (type);
CREATE INDEX IF NOT EXISTS "IDX_TRACKING_EVENTS_LOAD_ID" ON tracking_events ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_TRACKING_EVENTS_TIMESTAMP" ON tracking_events (timestamp);
CREATE INDEX IF NOT EXISTS "IDX_ALERTS_LOAD_ID" ON alerts ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_ALERTS_STATUS" ON alerts (status);
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_EVENTS_LOAD_ID" ON audit_events ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_EVENTS_CREATED_AT" ON audit_events ("createdAt");
CREATE INDEX IF NOT EXISTS "IDX_PRICE_SUGGESTIONS_LOAD_ID" ON price_suggestions ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_PRICE_SUGGESTIONS_STATUS" ON price_suggestions (status);

-- Create foreign keys
ALTER TABLE documents ADD CONSTRAINT "FK_DOCUMENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE tracking_events ADD CONSTRAINT "FK_TRACKING_EVENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE alerts ADD CONSTRAINT "FK_ALERTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE audit_events ADD CONSTRAINT "FK_AUDIT_EVENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE price_suggestions ADD CONSTRAINT "FK_PRICE_SUGGESTIONS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

-- Add indexes to loads table for new columns
CREATE INDEX IF NOT EXISTS "IDX_LOADS_REFERENCE" ON loads (reference);
CREATE INDEX IF NOT EXISTS "IDX_LOADS_LOAD_TYPE" ON loads ("loadType");
CREATE INDEX IF NOT EXISTS "IDX_LOADS_EQUIPMENT_TYPE" ON loads ("equipmentType");
CREATE INDEX IF NOT EXISTS "IDX_LOADS_VISIBILITY" ON loads (visibility);
CREATE INDEX IF NOT EXISTS "IDX_LOADS_ASSIGNED_CARRIER" ON loads ("assignedCarrierId");

-- Commit the transaction
COMMIT;

-- Display success message
SELECT 'Migration completed successfully!' as status;
