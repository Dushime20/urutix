-- Check if documents table exists and has data
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN "entityType" = 'DRIVER' THEN 1 END) as driver_documents
FROM documents;

-- Check recent driver documents
SELECT 
    id,
    "entityType",
    "entityId",
    title,
    "documentType",
    status,
    "createdAt"
FROM documents
WHERE "entityType" = 'DRIVER'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check if there are any drivers
SELECT 
    id,
    "firstName",
    "lastName",
    email
FROM drivers
LIMIT 5;
