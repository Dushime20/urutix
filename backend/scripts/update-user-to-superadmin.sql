-- Update user to SUPER_ADMIN (System Admin)
-- User ID: e705fb93-ae73-4522-b9e0-43ea9ce46de4
-- Tenant ID: 47a581e7-9234-4fdb-879c-656983090af6
-- Email: admin@urutix.com

UPDATE users 
SET role = 'SUPER_ADMIN', 
    updated_at = NOW()
WHERE id = 'e705fb93-ae73-4522-b9e0-43ea9ce46de4'
  AND tenant_id = '47a581e7-9234-4fdb-879c-656983090af6'
  AND email = 'admin@urutix.com';

-- Verify the change
SELECT id, email, role, tenant_id, updated_at 
FROM users 
WHERE id = 'e705fb93-ae73-4522-b9e0-43ea9ce46de4';
