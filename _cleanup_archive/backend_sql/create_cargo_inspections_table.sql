-- Create cargo_inspections table
-- Run this script directly in your PostgreSQL database if the migration was rolled back

-- Create enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cargo_inspections_status_enum') THEN
        CREATE TYPE "public"."cargo_inspections_status_enum" AS ENUM(
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'DISPUTED'
        );
    END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS "cargo_inspections" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "loadId" uuid NOT NULL,
    "receiverId" uuid NOT NULL,
    "status" "public"."cargo_inspections_status_enum" NOT NULL DEFAULT 'PENDING',
    "checklist" jsonb NOT NULL DEFAULT '[]',
    "overallNotes" text,
    "allItemsVerified" boolean NOT NULL DEFAULT false,
    "verifiedCount" integer NOT NULL DEFAULT 0,
    "totalItems" integer NOT NULL DEFAULT 0,
    "discrepancyCount" integer NOT NULL DEFAULT 0,
    "discrepancies" jsonb,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_cargo_inspections_id" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_receiverId" 
ON "cargo_inspections" ("loadId", "receiverId");

CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_status_createdAt" 
ON "cargo_inspections" ("status", "createdAt");

-- Create foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_cargo_inspections_loadId'
    ) THEN
        ALTER TABLE "cargo_inspections"
        ADD CONSTRAINT "FK_cargo_inspections_loadId"
        FOREIGN KEY ("loadId")
        REFERENCES "loads"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_cargo_inspections_receiverId'
    ) THEN
        ALTER TABLE "cargo_inspections"
        ADD CONSTRAINT "FK_cargo_inspections_receiverId"
        FOREIGN KEY ("receiverId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    END IF;
END $$;

