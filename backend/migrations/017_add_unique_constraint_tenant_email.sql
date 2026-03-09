-- Migration: Add unique constraint to tenant contactEmail
-- This prevents duplicate emails across tenants

-- Step 1: First, let's identify and handle duplicates
-- We'll keep the most recent ACTIVE tenant for each email, or the most recent one if none are active

DO $$
DECLARE
    duplicate_email RECORD;
    keeper_id UUID;
BEGIN
    -- For each duplicate email
    FOR duplicate_email IN 
        SELECT "contactEmail", COUNT(*) as count
        FROM tenants
        WHERE "contactEmail" IS NOT NULL AND "contactEmail" != ''
        GROUP BY "contactEmail"
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Processing duplicate email: %', duplicate_email."contactEmail";
        
        -- Find the tenant to keep (prefer ACTIVE, then most recent)
        SELECT id INTO keeper_id
        FROM tenants
        WHERE "contactEmail" = duplicate_email."contactEmail"
        ORDER BY 
            CASE 
                WHEN status = 'ACTIVE' THEN 1
                WHEN status = 'PENDING_ACTIVATION' THEN 2
                WHEN status = 'SUSPENDED' THEN 3
                ELSE 4
            END,
            "createdAt" DESC
        LIMIT 1;
        
        RAISE NOTICE 'Keeping tenant: %', keeper_id;
        
        -- Update duplicates to have NULL email (we'll handle them manually)
        UPDATE tenants
        SET "contactEmail" = "contactEmail" || '_duplicate_' || id::text
        WHERE "contactEmail" = duplicate_email."contactEmail"
        AND id != keeper_id;
        
        RAISE NOTICE 'Marked % duplicates for email: %', (duplicate_email.count - 1), duplicate_email."contactEmail";
    END LOOP;
END $$;

-- Step 2: Add unique constraint
ALTER TABLE tenants 
ADD CONSTRAINT unique_tenant_contact_email 
UNIQUE ("contactEmail");

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_contact_email 
ON tenants ("contactEmail") 
WHERE "contactEmail" IS NOT NULL;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added unique constraint to tenant contactEmail';
    RAISE NOTICE 'Duplicate emails have been suffixed with _duplicate_<id>';
    RAISE NOTICE 'Please review and manually update these tenants';
END $$;
