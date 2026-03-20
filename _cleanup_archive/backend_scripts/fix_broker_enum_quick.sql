-- Add BROKER to users_role_enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'BROKER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
  ) THEN
    ALTER TYPE users_role_enum ADD VALUE 'BROKER';
    RAISE NOTICE 'BROKER role added to enum';
  ELSE
    RAISE NOTICE 'BROKER role already exists in enum';
  END IF;
END $$;