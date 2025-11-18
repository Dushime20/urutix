-- Driver Database Migration Script
-- This script creates the complete driver management system schema
-- Run this script directly in your PostgreSQL database

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create drivers table
CREATE TABLE "drivers" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "employerId" uuid NOT NULL,
  "employeeId" character varying,
  "firstName" character varying NOT NULL,
  "lastName" character varying NOT NULL,
  "email" character varying NOT NULL,
  "phone" character varying NOT NULL,
  "dateOfBirth" date NOT NULL,
  "address" text NOT NULL,
  "emergencyContact" jsonb NOT NULL DEFAULT '{}',
  "licenseNumber" character varying(50) NOT NULL,
  "licenseClasses" jsonb NOT NULL DEFAULT '[]',
  "licenseIssueDate" date NOT NULL,
  "licenseExpiry" date NOT NULL,
  "licenseState" character varying(50) NOT NULL,
  "licenseCountry" character varying(50) NOT NULL,
  "endorsements" jsonb NOT NULL DEFAULT '[]',
  "restrictions" jsonb NOT NULL DEFAULT '[]',
  "employmentType" character varying NOT NULL DEFAULT 'FULL_TIME',
  "hireDate" date NOT NULL,
  "terminationDate" date,
  "status" character varying NOT NULL DEFAULT 'ACTIVE',
  "availabilityStatus" character varying NOT NULL DEFAULT 'AVAILABLE',
  "currentTruckId" uuid,
  "currentTripId" uuid,
  "currentLocation" geometry(Point,4326),
  "locationUpdatedAt" TIMESTAMP,
  "hoursWorkedThisWeek" numeric(5,2) NOT NULL DEFAULT 0,
  "hoursWorkedThisMonth" numeric(5,2) NOT NULL DEFAULT 0,
  "lastBreakTime" TIMESTAMP,
  "consecutiveDrivingHours" integer NOT NULL DEFAULT 0,
  "medicalCertExpiry" date,
  "drugTestDate" date,
  "backgroundCheckDate" date,
  "trainingCompletionDate" date,
  "certifications" jsonb NOT NULL DEFAULT '[]',
  "rating" numeric(3,2) NOT NULL DEFAULT 0,
  "totalTrips" integer NOT NULL DEFAULT 0,
  "totalDistance" numeric(12,2) NOT NULL DEFAULT 0,
  "safetyScore" numeric(5,2) NOT NULL DEFAULT 100,
  "onTimeDeliveryRate" numeric(5,2) NOT NULL DEFAULT 0,
  "hourlyRate" numeric(10,2),
  "mileageRate" numeric(10,2),
  "totalEarnings" numeric(15,2) NOT NULL DEFAULT 0,
  "preferences" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_drivers" PRIMARY KEY ("id")
);

-- Create driver_alerts table
CREATE TABLE "driver_alerts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "type" character varying NOT NULL,
  "severity" character varying NOT NULL,
  "message" text NOT NULL,
  "location" geometry(Point,4326),
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "isResolved" boolean NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP,
  "resolvedBy" uuid,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_driver_alerts" PRIMARY KEY ("id")
);

-- Create trip_events table
CREATE TABLE "trip_events" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tripId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "eventType" character varying NOT NULL,
  "eventData" jsonb NOT NULL DEFAULT '{}',
  "location" geometry(Point,4326),
  "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trip_events" PRIMARY KEY ("id")
);

-- Create trip_locations table
CREATE TABLE "trip_locations" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tripId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "location" geometry(Point,4326) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
  "speed" numeric(5,2),
  "heading" numeric(5,2),
  "altitude" numeric(8,2),
  "accuracy" numeric(5,2),
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trip_locations" PRIMARY KEY ("id")
);

-- Create driver_documents table
CREATE TABLE "driver_documents" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "documentType" character varying NOT NULL,
  "documentNumber" character varying,
  "documentUrl" text NOT NULL,
  "fileName" character varying NOT NULL,
  "fileSize" integer NOT NULL,
  "mimeType" character varying NOT NULL,
  "expiryDate" date,
  "isVerified" boolean NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP,
  "verifiedBy" uuid,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_driver_documents" PRIMARY KEY ("id")
);

-- Create driver_notifications table
CREATE TABLE "driver_notifications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "type" character varying NOT NULL,
  "title" character varying NOT NULL,
  "message" text NOT NULL,
  "priority" character varying NOT NULL DEFAULT 'NORMAL',
  "category" character varying NOT NULL,
  "isRead" boolean NOT NULL DEFAULT false,
  "readAt" TIMESTAMP,
  "actionUrl" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_driver_notifications" PRIMARY KEY ("id")
);

-- Create driver_earnings table
CREATE TABLE "driver_earnings" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "tripId" uuid,
  "period" character varying NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "basePay" numeric(10,2) NOT NULL DEFAULT 0,
  "bonus" numeric(10,2) NOT NULL DEFAULT 0,
  "deductions" numeric(10,2) NOT NULL DEFAULT 0,
  "netPay" numeric(10,2) NOT NULL DEFAULT 0,
  "hoursWorked" numeric(5,2) NOT NULL DEFAULT 0,
  "distanceTraveled" numeric(10,2) NOT NULL DEFAULT 0,
  "tripsCompleted" integer NOT NULL DEFAULT 0,
  "status" character varying NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_driver_earnings" PRIMARY KEY ("id")
);

-- Create driver_safety_metrics table
CREATE TABLE "driver_safety_metrics" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "driverId" uuid NOT NULL,
  "tenantId" uuid NOT NULL,
  "period" character varying NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "overallScore" numeric(5,2) NOT NULL DEFAULT 100,
  "drivingScore" numeric(5,2) NOT NULL DEFAULT 100,
  "complianceScore" numeric(5,2) NOT NULL DEFAULT 100,
  "vehicleScore" numeric(5,2) NOT NULL DEFAULT 100,
  "violations" integer NOT NULL DEFAULT 0,
  "accidents" integer NOT NULL DEFAULT 0,
  "nearMisses" integer NOT NULL DEFAULT 0,
  "safetyTrainingHours" numeric(5,2) NOT NULL DEFAULT 0,
  "certificationsMaintained" integer NOT NULL DEFAULT 0,
  "inspectionsPassed" integer NOT NULL DEFAULT 0,
  "inspectionsFailed" integer NOT NULL DEFAULT 0,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_driver_safety_metrics" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE UNIQUE INDEX "IDX_drivers_license_number" ON "drivers" ("licenseNumber") WHERE "deleted_at" IS NULL;
CREATE INDEX "IDX_drivers_tenant_employer" ON "drivers" ("tenantId", "employerId");
CREATE INDEX "IDX_drivers_user_id" ON "drivers" ("userId");
CREATE INDEX "IDX_drivers_status_availability" ON "drivers" ("status", "availabilityStatus");
CREATE INDEX "IDX_drivers_current_location" ON "drivers" USING GIST ("currentLocation");

CREATE INDEX "IDX_driver_alerts_driver_id" ON "driver_alerts" ("driverId");
CREATE INDEX "IDX_driver_alerts_tenant_id" ON "driver_alerts" ("tenantId");
CREATE INDEX "IDX_driver_alerts_type_severity" ON "driver_alerts" ("type", "severity");

CREATE INDEX "IDX_trip_events_driver_trip" ON "trip_events" ("driverId", "tripId");
CREATE INDEX "IDX_trip_events_timestamp" ON "trip_events" ("timestamp");

CREATE INDEX "IDX_trip_locations_driver_trip" ON "trip_locations" ("driverId", "tripId");
CREATE INDEX "IDX_trip_locations_timestamp" ON "trip_locations" ("timestamp");
CREATE INDEX "IDX_trip_locations_location" ON "trip_locations" USING GIST ("location");

CREATE INDEX "IDX_driver_documents_driver_id" ON "driver_documents" ("driverId");
CREATE INDEX "IDX_driver_documents_type" ON "driver_documents" ("documentType");

CREATE INDEX "IDX_driver_notifications_driver_id" ON "driver_notifications" ("driverId");
CREATE INDEX "IDX_driver_notifications_type_priority" ON "driver_notifications" ("type", "priority");

CREATE INDEX "IDX_driver_earnings_driver_period" ON "driver_earnings" ("driverId", "period");
CREATE INDEX "IDX_driver_safety_metrics_driver_period" ON "driver_safety_metrics" ("driverId", "period");

-- Add foreign key constraints
ALTER TABLE "driver_alerts" 
ADD CONSTRAINT "FK_driver_alerts_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "trip_events" 
ADD CONSTRAINT "FK_trip_events_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "trip_locations" 
ADD CONSTRAINT "FK_trip_locations_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "driver_documents" 
ADD CONSTRAINT "FK_driver_documents_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "driver_notifications" 
ADD CONSTRAINT "FK_driver_notifications_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "driver_earnings" 
ADD CONSTRAINT "FK_driver_earnings_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "driver_safety_metrics" 
ADD CONSTRAINT "FK_driver_safety_metrics_driver" 
FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE "drivers" 
ADD CONSTRAINT "drivers_employment_type_check" 
CHECK ("employmentType" IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'OWNER_OPERATOR', 'FREELANCE'));

ALTER TABLE "drivers" 
ADD CONSTRAINT "drivers_status_check" 
CHECK ("status" IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED', 'IN_TRANSIT'));

ALTER TABLE "drivers" 
ADD CONSTRAINT "drivers_rating_check" 
CHECK ("rating" >= 0 AND "rating" <= 5);

ALTER TABLE "drivers" 
ADD CONSTRAINT "drivers_safety_score_check" 
CHECK ("safetyScore" >= 0 AND "safetyScore" <= 100);

ALTER TABLE "drivers" 
ADD CONSTRAINT "drivers_on_time_delivery_rate_check" 
CHECK ("onTimeDeliveryRate" >= 0 AND "onTimeDeliveryRate" <= 100);

ALTER TABLE "driver_alerts" 
ADD CONSTRAINT "driver_alerts_severity_check" 
CHECK ("severity" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

ALTER TABLE "driver_notifications" 
ADD CONSTRAINT "driver_notifications_priority_check" 
CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

ALTER TABLE "driver_earnings" 
ADD CONSTRAINT "driver_earnings_status_check" 
CHECK ("status" IN ('PENDING', 'APPROVED', 'PAID', 'CANCELLED'));

ALTER TABLE "driver_safety_metrics" 
ADD CONSTRAINT "driver_safety_metrics_score_check" 
CHECK ("overallScore" >= 0 AND "overallScore" <= 100);

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want to insert sample data

/*
INSERT INTO "drivers" (
  "id", "tenantId", "userId", "employerId", "firstName", "lastName", 
  "email", "phone", "dateOfBirth", "address", "licenseNumber", 
  "licenseIssueDate", "licenseExpiry", "licenseState", "licenseCountry", 
  "hireDate", "status", "availabilityStatus"
) VALUES (
  uuid_generate_v4(), 
  uuid_generate_v4(), -- Replace with actual tenant ID
  uuid_generate_v4(), -- Replace with actual user ID
  uuid_generate_v4(), -- Replace with actual employer ID
  'John', 'Doe', 
  'john.doe@example.com', '+1234567890', '1985-01-15', 
  '123 Main St, Anytown, USA', 'DL123456789', 
  '2020-01-01', '2025-01-01', 'CA', 'USA', 
  '2020-02-01', 'ACTIVE', 'AVAILABLE'
);
*/

-- Create a rollback script (save this separately)
/*
-- Rollback script (run this to undo the migration)
-- Drop foreign key constraints first
ALTER TABLE "driver_safety_metrics" DROP CONSTRAINT "FK_driver_safety_metrics_driver";
ALTER TABLE "driver_earnings" DROP CONSTRAINT "FK_driver_earnings_driver";
ALTER TABLE "driver_notifications" DROP CONSTRAINT "FK_driver_notifications_driver";
ALTER TABLE "driver_documents" DROP CONSTRAINT "FK_driver_documents_driver";
ALTER TABLE "trip_locations" DROP CONSTRAINT "FK_trip_locations_driver";
ALTER TABLE "trip_events" DROP CONSTRAINT "FK_trip_events_driver";
ALTER TABLE "driver_alerts" DROP CONSTRAINT "FK_driver_alerts_driver";

-- Drop check constraints
ALTER TABLE "driver_safety_metrics" DROP CONSTRAINT "driver_safety_metrics_score_check";
ALTER TABLE "driver_earnings" DROP CONSTRAINT "driver_earnings_status_check";
ALTER TABLE "driver_notifications" DROP CONSTRAINT "driver_notifications_priority_check";
ALTER TABLE "driver_alerts" DROP CONSTRAINT "driver_alerts_severity_check";
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_on_time_delivery_rate_check";
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_safety_score_check";
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_rating_check";
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_status_check";
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_employment_type_check";

-- Drop tables
DROP TABLE "driver_safety_metrics";
DROP TABLE "driver_earnings";
DROP TABLE "driver_notifications";
DROP TABLE "driver_documents";
DROP TABLE "trip_locations";
DROP TABLE "trip_events";
DROP TABLE "driver_alerts";
DROP TABLE "drivers";
*/

-- Migration completed successfully!
-- The driver database schema is now ready for use.
