-- Create safety_trainings table
CREATE TABLE IF NOT EXISTS safety_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('defensive_driving', 'hazmat', 'first_aid', 'emergency_procedures', 'regulations', 'technology')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  required BOOLEAN DEFAULT false,
  frequency VARCHAR(50) CHECK (frequency IN ('once', 'annually', 'biannually', 'quarterly')),
  "lastCompleted" TIMESTAMP,
  "nextDue" TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'overdue')),
  "driverId" UUID,
  "driverName" VARCHAR(255),
  instructor VARCHAR(255) NOT NULL,
  score INTEGER,
  certificate VARCHAR(100),
  "scheduledDate" TIMESTAMP NOT NULL,
  "createdBy" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_safety_trainings_tenant_next_due ON safety_trainings("tenantId", "nextDue");
CREATE INDEX IF NOT EXISTS idx_safety_trainings_driver_status ON safety_trainings("driverId", status);
CREATE INDEX IF NOT EXISTS idx_safety_trainings_status_next_due ON safety_trainings(status, "nextDue");

-- Add comments for documentation
COMMENT ON TABLE safety_trainings IS 'Stores safety training records for fleet management';
COMMENT ON COLUMN safety_trainings.type IS 'Type of training: defensive_driving, hazmat, first_aid, emergency_procedures, regulations, technology';
COMMENT ON COLUMN safety_trainings.status IS 'Status: completed, pending, overdue';
COMMENT ON COLUMN safety_trainings."scheduledDate" IS 'When the training is scheduled to occur';

