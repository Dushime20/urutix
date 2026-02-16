-- Check current enum values
SELECT unnest(enum_range(NULL::users_role_enum)) AS role_values;

-- Add BROKER if it doesn't exist (safe operation)
ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'BROKER';

-- Verify BROKER is now in the enum
SELECT unnest(enum_range(NULL::users_role_enum)) AS role_values;