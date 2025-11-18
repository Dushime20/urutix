-- Simple Load Management Migration Script
-- Run this script step by step in your PostgreSQL database

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
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

-- Step 3: Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    "speedKph" DECIMAL(5,2),
    "headingDeg" DECIMAL(5,2),
    "accuracyM" DECIMAL(5,2),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    "postalCode" TEXT,
    "geofenceId" TEXT,
    "geofenceType" VARCHAR(20),
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

-- Step 4: Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'Medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
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

-- Step 5: Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    "entityType" VARCHAR(20) NOT NULL DEFAULT 'load',
    "entityId" UUID,
    action VARCHAR(30) NOT NULL,
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

-- Step 6: Create price_suggestions table
CREATE TABLE IF NOT EXISTS price_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loadId" UUID NOT NULL,
    "pricingModel" VARCHAR(20) NOT NULL DEFAULT 'market_rate',
    "suggestedAmount" DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    confidence DECIMAL(3,2) NOT NULL,
    "confidenceLevel" VARCHAR(10) NOT NULL DEFAULT 'medium',
    status VARCHAR(15) NOT NULL DEFAULT 'draft',
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

-- Step 7: Add new columns to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "loadType" VARCHAR(20) DEFAULT 'FTL';
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "equipmentType" VARCHAR(20) DEFAULT 'DRY_VAN';
ALTER TABLE loads ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) DEFAULT 'public';
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "unitsRequired" INTEGER DEFAULT 1;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin JSONB;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination JSONB;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "pickupWindow" JSONB;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "deliveryWindow" JSONB;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS pricing JSONB;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "paymentTerms" VARCHAR(10) DEFAULT 'Net30';
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "invitedCarriers" TEXT[];
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "assignedCarrierId" UUID;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS "packagingType" VARCHAR(20) DEFAULT 'Palletized';
ALTER TABLE loads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS "IDX_DOCUMENTS_LOAD_ID" ON documents ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_TRACKING_EVENTS_LOAD_ID" ON tracking_events ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_ALERTS_LOAD_ID" ON alerts ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_EVENTS_LOAD_ID" ON audit_events ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_PRICE_SUGGESTIONS_LOAD_ID" ON price_suggestions ("loadId");

-- Step 9: Create foreign keys
ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS "FK_DOCUMENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE tracking_events ADD CONSTRAINT IF NOT EXISTS "FK_TRACKING_EVENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE alerts ADD CONSTRAINT IF NOT EXISTS "FK_ALERTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE audit_events ADD CONSTRAINT IF NOT EXISTS "FK_AUDIT_EVENTS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE price_suggestions ADD CONSTRAINT IF NOT EXISTS "FK_PRICE_SUGGESTIONS_LOAD_ID" 
    FOREIGN KEY ("loadId") REFERENCES loads(id) ON DELETE CASCADE;

-- Step 10: Success message
SELECT 'Migration completed successfully!' as status;
