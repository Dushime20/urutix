-- Production-ready vehicle asset details and audit columns.

ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "assetDetails" jsonb DEFAULT '{}';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "createdBy" character varying(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "updatedBy" character varying(100);
