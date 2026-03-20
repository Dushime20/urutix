-- Create safety_incidents table
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('accident', 'near_miss', 'injury', 'property_damage', 'traffic_violation')),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  date TIMESTAMP NOT NULL,
  location VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  "driverId" UUID,
  "driverName" VARCHAR(255),
  "truckId" UUID,
  "truckPlate" VARCHAR(50),
  "weatherConditions" VARCHAR(100),
  "roadConditions" VARCHAR(100),
  injuries TEXT,
  "propertyDamage" DECIMAL(10, 2) DEFAULT 0,
  "policeReport" BOOLEAN DEFAULT false,
  "reportNumber" VARCHAR(100),
  status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  "assignedTo" VARCHAR(255),
  "correctiveActions" JSONB,
  cost DECIMAL(10, 2) DEFAULT 0,
  "insuranceClaim" BOOLEAN DEFAULT false,
  "claimNumber" VARCHAR(100),
  "createdBy" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_safety_incidents_tenant_date ON safety_incidents("tenantId", date);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_driver_status ON safety_incidents("driverId", status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_truck_status ON safety_incidents("truckId", status);

-- Add comments for documentation
COMMENT ON TABLE safety_incidents IS 'Stores safety incident records for fleet management';
COMMENT ON COLUMN safety_incidents.type IS 'Type of incident: accident, near_miss, injury, property_damage, traffic_violation';
COMMENT ON COLUMN safety_incidents.severity IS 'Severity level: minor, moderate, major, critical';
COMMENT ON COLUMN safety_incidents.status IS 'Status: reported, investigating, resolved, closed';

