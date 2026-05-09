-- Fix: Set userId to NULL for the active tenant-level subscription
-- The subscription should belong to the tenant, not a specific user
UPDATE tenant_subscriptions 
SET user_id = NULL 
WHERE id = '81320337-d1b1-4ab8-a53e-98e61371acbb'
  AND tenant_id = 'a6d0858d-eb06-4748-9b12-d847e74d7d9b'
  AND status = 'active';

-- Verify the fix
SELECT id, status, user_id, tenant_id FROM tenant_subscriptions 
WHERE tenant_id = 'a6d0858d-eb06-4748-9b12-d847e74d7d9b';
