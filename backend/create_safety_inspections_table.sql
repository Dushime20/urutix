-- Create safety_inspections table
CREATE TABLE IF NOT EXISTS safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pre_trip', 'post_trip', 'weekly', 'monthly', 'annual', 'random')),
  inspector VARCHAR(255) NOT NULL,
  "inspectionDate" TIMESTAMP NOT NULL,
  "truckId" UUID,
  "truckPlate" VARCHAR(50),
  "driverId" UUID,
  "driverName" VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('passed', 'failed', 'conditional')),
  score INTEGER DEFAULT 0,
  "maxScore" INTEGER DEFAULT 100,
  items JSONB,
  notes TEXT,
  "nextInspectionDate" TIMESTAMP,
  "complianceStatus" VARCHAR(50) DEFAULT 'compliant' CHECK ("complianceStatus" IN ('compliant', 'non_compliant')),
  "createdBy" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_safety_inspections_tenant_date ON safety_inspections("tenantId", "inspectionDate");
CREATE INDEX IF NOT EXISTS idx_safety_inspections_truck_status ON safety_inspections("truckId", status);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_driver_status ON safety_inspections("driverId", status);

-- Add comments for documentation
COMMENT ON TABLE safety_inspections IS 'Stores safety inspection records for fleet management';
COMMENT ON COLUMN safety_inspections.type IS 'Type of inspection: pre_trip, post_trip, weekly, monthly, annual, random';
COMMENT ON COLUMN safety_inspections.status IS 'Status: passed, failed, conditional';
COMMENT ON COLUMN safety_inspections."complianceStatus" IS 'Compliance status: compliant, non_compliant';

