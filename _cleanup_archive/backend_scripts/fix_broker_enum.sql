-- Verify current enum values
SELECT unnest(enum_range(NULL::users_role_enum)) AS role_values;

-- Ensure BROKER is in the enum (this is safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BROKER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
    ) THEN
        ALTER TYPE users_role_enum ADD VALUE 'BROKER';
    END IF;
END $$;

-- Verify BROKER is now in the enum
SELECT unnest(enum_range(NULL::users_role_enum)) AS role_values;