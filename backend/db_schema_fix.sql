-- SQL Commands to enable Multi-Role Login Schema
-- Run these commands in your database query tool (e.g., pgAdmin, DBeaver)

-- 1. Remove the old constraint that forces emails to be globally unique
-- (The ID 'UQ_97672ac88f789774dd47f7c8be3' comes from your error logs)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";

-- 2. Also drop the index associated with it if it exists separately
DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be3";

-- 3. Create the new composite unique index
-- This allows the same email to exist multiple times, AS LONG AS the 'role' or 'tenantId' is different.
-- This supports your requirement: One User Email -> Multiple Roles (Cargo Owner, Truck Owner, etc.)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_tenant_email_role" 
ON "users" ("tenantId", "email", "role") 
WHERE "deleted_at" IS NULL;
