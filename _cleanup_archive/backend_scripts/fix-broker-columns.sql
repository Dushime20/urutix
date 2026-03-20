-- SQL Script to Add Broker Commission Columns to Users Table
-- Run this script directly in your PostgreSQL database

-- Add totalCommissionEarned column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'totalCommissionEarned'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN "totalCommissionEarned" DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added totalCommissionEarned column';
    ELSE
        RAISE NOTICE 'totalCommissionEarned column already exists';
    END IF;
END $$;

-- Add defaultCommissionRate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'defaultCommissionRate'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN "defaultCommissionRate" DECIMAL(5,2);
        RAISE NOTICE 'Added defaultCommissionRate column';
    ELSE
        RAISE NOTICE 'defaultCommissionRate column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('totalCommissionEarned', 'defaultCommissionRate')
ORDER BY column_name;
