-- Check documents for this specific driver
SELECT 
    id,
    "entityType",
    "entityId",
    title,
    "documentType",
    status,
    "originalFileName",
    "createdAt"
FROM documents
WHERE "entityType" = 'DRIVER' 
  AND "entityId" = 'c51d2693-0e0f-49f2-981f-2fb0c8bcdeac';

-- Check all driver documents
SELECT 
    COUNT(*) as total_driver_docs
FROM documents
WHERE "entityType" = 'DRIVER';

-- List all drivers to see which ones we have
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    "createdAt"
FROM drivers
ORDER BY "createdAt" DESC
LIMIT 5;
