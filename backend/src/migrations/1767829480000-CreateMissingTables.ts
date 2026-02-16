import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMissingTables1767829480000 implements MigrationInterface {
    name = 'CreateMissingTables1767829480000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types for fuel_logs
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_logs_status_enum') THEN CREATE TYPE "public"."fuel_logs_status_enum" AS ENUM('VERIFIED', 'PENDING', 'FLAGGED', 'REJECTED'); END IF; END $$;`);

        // Create fuel_logs table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "fuel_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "truck_id" uuid NOT NULL,
                "driver_id" uuid,
                "created_by" uuid NOT NULL,
                "fuel_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "fuel_amount" numeric(10,2) NOT NULL,
                "gallons" numeric(10,2) NOT NULL,
                "price_per_gallon" numeric(10,2) NOT NULL,
                "total_cost" numeric(10,2) NOT NULL,
                "location" varchar(255) NOT NULL,
                "odometer" numeric(10,2),
                "status" "public"."fuel_logs_status_enum" NOT NULL DEFAULT 'PENDING',
                "receipt_number" varchar(100),
                "payment_method" varchar(100),
                "notes" text,
                "metadata" jsonb DEFAULT '{}',
                "is_flagged" boolean DEFAULT false,
                "flag_reason" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_fuel_logs" PRIMARY KEY ("id")
            )
        `);

        // Create enum types for safety_trainings
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_type_enum') THEN CREATE TYPE "public"."safety_trainings_type_enum" AS ENUM('defensive_driving', 'hazmat', 'first_aid', 'emergency_procedures', 'regulations', 'technology'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_frequency_enum') THEN CREATE TYPE "public"."safety_trainings_frequency_enum" AS ENUM('once', 'annually', 'biannually', 'quarterly'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_trainings_status_enum') THEN CREATE TYPE "public"."safety_trainings_status_enum" AS ENUM('completed', 'pending', 'overdue'); END IF; END $$;`);

        // Create safety_trainings table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "safety_trainings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "type" "public"."safety_trainings_type_enum" NOT NULL,
                "title" varchar(255) NOT NULL,
                "description" text,
                "duration" integer NOT NULL,
                "required" boolean DEFAULT false,
                "frequency" "public"."safety_trainings_frequency_enum",
                "lastCompleted" TIMESTAMP,
                "nextDue" TIMESTAMP NOT NULL,
                "status" "public"."safety_trainings_status_enum" NOT NULL DEFAULT 'pending',
                "driverId" uuid,
                "driverName" varchar(255),
                "instructor" varchar(255) NOT NULL,
                "score" integer,
                "certificate" varchar(100),
                "scheduledDate" TIMESTAMP,
                "createdBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_safety_trainings" PRIMARY KEY ("id")
            )
        `);

        // Create enum types for safety_inspections
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_type_enum') THEN CREATE TYPE "public"."safety_inspections_type_enum" AS ENUM('pre_trip', 'post_trip', 'weekly', 'monthly', 'annual', 'random'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_status_enum') THEN CREATE TYPE "public"."safety_inspections_status_enum" AS ENUM('passed', 'failed', 'conditional'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_inspections_compliancestatus_enum') THEN CREATE TYPE "public"."safety_inspections_compliancestatus_enum" AS ENUM('compliant', 'non_compliant'); END IF; END $$;`);

        // Create safety_inspections table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "safety_inspections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "type" "public"."safety_inspections_type_enum" NOT NULL,
                "inspector" varchar(255) NOT NULL,
                "inspectionDate" TIMESTAMP NOT NULL,
                "truckId" uuid,
                "truckPlate" varchar(50),
                "driverId" uuid,
                "driverName" varchar(255),
                "status" "public"."safety_inspections_status_enum" NOT NULL,
                "score" integer DEFAULT 0,
                "maxScore" integer DEFAULT 100,
                "items" json,
                "notes" text,
                "nextInspectionDate" TIMESTAMP,
                "complianceStatus" "public"."safety_inspections_compliancestatus_enum" DEFAULT 'compliant',
                "createdBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_safety_inspections" PRIMARY KEY ("id")
            )
        `);

        // Create enum types for safety_incidents
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_type_enum') THEN CREATE TYPE "public"."safety_incidents_type_enum" AS ENUM('accident', 'near_miss', 'injury', 'property_damage', 'traffic_violation'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_severity_enum') THEN CREATE TYPE "public"."safety_incidents_severity_enum" AS ENUM('minor', 'moderate', 'major', 'critical'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_incidents_status_enum') THEN CREATE TYPE "public"."safety_incidents_status_enum" AS ENUM('reported', 'investigating', 'resolved', 'closed'); END IF; END $$;`);

        // Create safety_incidents table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "safety_incidents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "type" "public"."safety_incidents_type_enum" NOT NULL,
                "severity" "public"."safety_incidents_severity_enum" NOT NULL,
                "date" TIMESTAMP NOT NULL,
                "location" varchar(500) NOT NULL,
                "description" text NOT NULL,
                "driverId" uuid,
                "driverName" varchar(255),
                "truckId" uuid,
                "truckPlate" varchar(50),
                "weatherConditions" varchar(100),
                "roadConditions" varchar(100),
                "injuries" text,
                "propertyDamage" numeric(10,2) DEFAULT 0,
                "policeReport" boolean DEFAULT false,
                "reportNumber" varchar(100),
                "status" "public"."safety_incidents_status_enum" NOT NULL DEFAULT 'reported',
                "assignedTo" varchar(255),
                "correctiveActions" json,
                "cost" numeric(10,2) DEFAULT 0,
                "insuranceClaim" boolean DEFAULT false,
                "claimNumber" varchar(100),
                "createdBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_safety_incidents" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for fuel_logs
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_tenant_truck" ON "fuel_logs" ("tenant_id", "truck_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_tenant_driver" ON "fuel_logs" ("tenant_id", "driver_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_tenant_status" ON "fuel_logs" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_tenant_date" ON "fuel_logs" ("tenant_id", "fuel_date")`);

        // Create indexes for safety_trainings
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_trainings_tenant_nextdue" ON "safety_trainings" ("tenantId", "nextDue")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_trainings_driver_status" ON "safety_trainings" ("driverId", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_trainings_status_nextdue" ON "safety_trainings" ("status", "nextDue")`);

        // Create indexes for safety_inspections
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_inspections_tenant_date" ON "safety_inspections" ("tenantId", "inspectionDate")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_inspections_truck_status" ON "safety_inspections" ("truckId", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_inspections_driver_status" ON "safety_inspections" ("driverId", "status")`);

        // Create indexes for safety_incidents
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_incidents_tenant_date" ON "safety_incidents" ("tenantId", "date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_incidents_driver_status" ON "safety_incidents" ("driverId", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_safety_incidents_truck_status" ON "safety_incidents" ("truckId", "status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "safety_incidents" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "safety_inspections" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "safety_trainings" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "fuel_logs" CASCADE`);
        
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_incidents_status_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_incidents_severity_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_incidents_type_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_inspections_compliancestatus_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_inspections_status_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_inspections_type_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_trainings_status_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_trainings_frequency_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."safety_trainings_type_enum" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."fuel_logs_status_enum" CASCADE`);
    }
}
