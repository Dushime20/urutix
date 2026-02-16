-- This script wraps all safety table operations in table existence checks
-- Run this to fix the migration issues with safety tables

-- Safety Trainings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='safety_trainings') THEN
        -- Drop and recreate type column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='type') THEN
            ALTER TABLE "safety_trainings" DROP COLUMN "type";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_type_enum') THEN
            CREATE TYPE "public"."safety_trainings_type_enum" AS ENUM('defensive_driving', 'hazmat', 'first_aid', 'emergency_procedures', 'regulations', 'technology');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='type') THEN
            ALTER TABLE "safety_trainings" ADD "type" "public"."safety_trainings_type_enum" NOT NULL;
        END IF;
        
        -- Set required column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='required') THEN
            ALTER TABLE "safety_trainings" ALTER COLUMN "required" SET NOT NULL;
        END IF;
        
        -- Handle frequency column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='frequency') THEN
            ALTER TABLE "safety_trainings" DROP COLUMN "frequency";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_frequency_enum') THEN
            CREATE TYPE "public"."safety_trainings_frequency_enum" AS ENUM('once', 'annually', 'biannually', 'quarterly');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='frequency') THEN
            ALTER TABLE "safety_trainings" ADD "frequency" "public"."safety_trainings_frequency_enum";
        END IF;
        
        -- Handle status column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='status') THEN
            ALTER TABLE "safety_trainings" DROP COLUMN "status";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_status_enum') THEN
            CREATE TYPE "public"."safety_trainings_status_enum" AS ENUM('completed', 'pending', 'overdue');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='status') THEN
            ALTER TABLE "safety_trainings" ADD "status" "public"."safety_trainings_status_enum" NOT NULL DEFAULT 'pending';
        END IF;
        
        -- Handle timestamps
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='scheduledDate') THEN
            ALTER TABLE "safety_trainings" ALTER COLUMN "scheduledDate" DROP NOT NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='createdAt') THEN
            ALTER TABLE "safety_trainings" ALTER COLUMN "createdAt" SET NOT NULL;
            ALTER TABLE "safety_trainings" ALTER COLUMN "createdAt" SET DEFAULT now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_trainings' AND column_name='updatedAt') THEN
            ALTER TABLE "safety_trainings" ALTER COLUMN "updatedAt" SET NOT NULL;
            ALTER TABLE "safety_trainings" ALTER COLUMN "updatedAt" SET DEFAULT now();
        END IF;
    END IF;
END $$;

-- Safety Inspections
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='safety_inspections') THEN
        -- Handle type column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='type') THEN
            ALTER TABLE "safety_inspections" DROP COLUMN "type";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_type_enum') THEN
            CREATE TYPE "public"."safety_inspections_type_enum" AS ENUM('pre_trip', 'post_trip', 'weekly', 'monthly', 'annual', 'random');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='type') THEN
            ALTER TABLE "safety_inspections" ADD "type" "public"."safety_inspections_type_enum" NOT NULL;
        END IF;
        
        -- Handle status column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='status') THEN
            ALTER TABLE "safety_inspections" DROP COLUMN "status";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_status_enum') THEN
            CREATE TYPE "public"."safety_inspections_status_enum" AS ENUM('passed', 'failed', 'conditional');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='status') THEN
            ALTER TABLE "safety_inspections" ADD "status" "public"."safety_inspections_status_enum" NOT NULL;
        END IF;
        
        -- Handle score columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='score') THEN
            ALTER TABLE "safety_inspections" ALTER COLUMN "score" SET NOT NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='maxScore') THEN
            ALTER TABLE "safety_inspections" ALTER COLUMN "maxScore" SET NOT NULL;
        END IF;
        
        -- Handle items column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='items') THEN
            ALTER TABLE "safety_inspections" DROP COLUMN "items";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='items') THEN
            ALTER TABLE "safety_inspections" ADD "items" json;
        END IF;
        
        -- Handle complianceStatus column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='complianceStatus') THEN
            ALTER TABLE "safety_inspections" DROP COLUMN "complianceStatus";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_compliancestatus_enum') THEN
            CREATE TYPE "public"."safety_inspections_compliancestatus_enum" AS ENUM('compliant', 'non_compliant');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='complianceStatus') THEN
            ALTER TABLE "safety_inspections" ADD "complianceStatus" "public"."safety_inspections_compliancestatus_enum" NOT NULL DEFAULT 'compliant';
        END IF;
        
        -- Handle timestamps
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='createdAt') THEN
            ALTER TABLE "safety_inspections" ALTER COLUMN "createdAt" SET NOT NULL;
            ALTER TABLE "safety_inspections" ALTER COLUMN "createdAt" SET DEFAULT now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_inspections' AND column_name='updatedAt') THEN
            ALTER TABLE "safety_inspections" ALTER COLUMN "updatedAt" SET NOT NULL;
            ALTER TABLE "safety_inspections" ALTER COLUMN "updatedAt" SET DEFAULT now();
        END IF;
    END IF;
END $$;

-- Safety Incidents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='safety_incidents') THEN
        -- Handle type column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='type') THEN
            ALTER TABLE "safety_incidents" DROP COLUMN "type";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_type_enum') THEN
            CREATE TYPE "public"."safety_incidents_type_enum" AS ENUM('accident', 'near_miss', 'injury', 'property_damage', 'traffic_violation');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='type') THEN
            ALTER TABLE "safety_incidents" ADD "type" "public"."safety_incidents_type_enum" NOT NULL;
        END IF;
        
        -- Handle severity column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='severity') THEN
            ALTER TABLE "safety_incidents" DROP COLUMN "severity";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_severity_enum') THEN
            CREATE TYPE "public"."safety_incidents_severity_enum" AS ENUM('minor', 'moderate', 'major', 'critical');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='severity') THEN
            ALTER TABLE "safety_incidents" ADD "severity" "public"."safety_incidents_severity_enum" NOT NULL;
        END IF;
        
        -- Handle other columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='propertyDamage') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "propertyDamage" SET NOT NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='policeReport') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "policeReport" SET NOT NULL;
        END IF;
        
        -- Handle status column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='status') THEN
            ALTER TABLE "safety_incidents" DROP COLUMN "status";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_status_enum') THEN
            CREATE TYPE "public"."safety_incidents_status_enum" AS ENUM('reported', 'investigating', 'resolved', 'closed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='status') THEN
            ALTER TABLE "safety_incidents" ADD "status" "public"."safety_incidents_status_enum" NOT NULL DEFAULT 'reported';
        END IF;
        
        -- Handle correctiveActions column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='correctiveActions') THEN
            ALTER TABLE "safety_incidents" DROP COLUMN "correctiveActions";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='correctiveActions') THEN
            ALTER TABLE "safety_incidents" ADD "correctiveActions" json;
        END IF;
        
        -- Handle other required columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='cost') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "cost" SET NOT NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='insuranceClaim') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "insuranceClaim" SET NOT NULL;
        END IF;
        
        -- Handle timestamps
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='createdAt') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "createdAt" SET NOT NULL;
            ALTER TABLE "safety_incidents" ALTER COLUMN "createdAt" SET DEFAULT now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='safety_incidents' AND column_name='updatedAt') THEN
            ALTER TABLE "safety_incidents" ALTER COLUMN "updatedAt" SET NOT NULL;
            ALTER TABLE "safety_incidents" ALTER COLUMN "updatedAt" SET DEFAULT now();
        END IF;
    END IF;
END $$;
