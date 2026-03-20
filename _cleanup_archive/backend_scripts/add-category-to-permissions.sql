-- Add category column to permissions table if it doesn't exist
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update existing permissions with categories based on their resource
UPDATE permissions 
SET category = CASE 
    WHEN resource LIKE 'user%' THEN 'User Management'
    WHEN resource LIKE 'truck%' OR resource LIKE 'fleet%' THEN 'Fleet Management'
    WHEN resource LIKE 'load%' OR resource LIKE 'cargo%' THEN 'Cargo Management'
    WHEN resource LIKE 'trip%' THEN 'Trip Management'
    WHEN resource LIKE 'driver%' THEN 'Driver Management'
    WHEN resource LIKE 'payment%' OR resource LIKE 'financial%' THEN 'Financial'
    WHEN resource LIKE 'tenant%' THEN 'Tenant Management'
    WHEN resource LIKE 'permission%' OR resource LIKE 'role%' THEN 'Permissions'
    WHEN resource LIKE 'report%' OR resource LIKE 'analytics%' THEN 'Reports & Analytics'
    WHEN resource LIKE 'system%' OR resource LIKE 'admin%' THEN 'System'
    ELSE 'General'
END
WHERE category IS NULL;
