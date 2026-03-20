-- Fix missing loadType column in production database
-- This script adds the missing loadType column and enum type

-- First, create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE loads_loadtype_enum AS ENUM ('FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the loadType column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE loads ADD COLUMN "loadType" loads_loadtype_enum NOT NULL DEFAULT 'FTL';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column loadType already exists in loads table.';
END $$;

-- Create index on loadType if it doesn't exist
DO $$ BEGIN
    CREATE INDEX "IDX_a53c7fe240b4a67cce9053625e" ON "loads" ("loadType");
EXCEPTION
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Index on loadType already exists.';
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'loads' AND column_name = 'loadType';