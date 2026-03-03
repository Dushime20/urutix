-- Fix for conflicting role_permissions migration
-- This script marks the conflicting migration as completed without running it

-- Check if migrations table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
        CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL
        );
    END IF;
END $$;

-- Mark the CreatePermissionsAndRoles migration as completed (skip it)
INSERT INTO migrations (timestamp, name)
VALUES (1738310000000, 'CreatePermissionsAndRoles1738310000000')
ON CONFLICT DO NOTHING;

-- Verify role_permissions table structure (should use VARCHAR role, not UUID role_id)
DO $$
BEGIN
    -- Drop role_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_permissions' AND column_name = 'role_id'
    ) THEN
        ALTER TABLE role_permissions DROP COLUMN role_id CASCADE;
        RAISE NOTICE 'Dropped role_id column from role_permissions';
    END IF;

    -- Ensure role column exists and is VARCHAR
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_permissions' AND column_name = 'role'
    ) THEN
        ALTER TABLE role_permissions ADD COLUMN role VARCHAR NOT NULL;
        RAISE NOTICE 'Added role VARCHAR column to role_permissions';
    END IF;
END $$;

-- Show final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM role_permissions LIMIT 5;

COMMIT;
