-- Enterprise vehicle fields and document-backed compliance JSON on trucks.

ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "manufacturer" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "chassis" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "availabilityStatus" character varying(50) DEFAULT 'AVAILABLE';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "ownershipType" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "vehicleClass" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "fleetGroup" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "businessUnit" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "costCenter" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "chassisConfiguration" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "dotNumber" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "mcNumber" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "operatingAuthority" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "crossBorderPermit" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "customsBond" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "portAuthorization" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "axleConfiguration" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "fuelTankCapacity" numeric(10,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "engineModel" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "horsepower" numeric(10,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "torque" numeric(10,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "transmission" character varying(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "grossVehicleWeight" numeric(12,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "driverRequirements" text;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "operationalRestrictions" text;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "emergencyContacts" jsonb DEFAULT '[]';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "complianceDocuments" jsonb DEFAULT '{}';
