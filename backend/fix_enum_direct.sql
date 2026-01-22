-- Connect to the database and run this script
-- Replace 'uruti' with your actual database name if different

\c uruti;

-- Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum') ORDER BY enumsortorder;

-- Add BROKER to the enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BROKER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
    ) THEN
        ALTER TYPE users_role_enum ADD VALUE 'BROKER';
        RAISE NOTICE 'Added BROKER to users_role_enum';
    ELSE
        RAISE NOTICE 'BROKER already exists in users_role_enum';
    END IF;
END $$;

-- Verify the enum now includes BROKER
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum') ORDER BY enumsortorder;