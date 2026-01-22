-- Create broker_commissions table
CREATE TABLE IF NOT EXISTS "broker_commissions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "brokerId" uuid NOT NULL,
  "loadId" uuid NOT NULL,
  "tripId" uuid,
  "loadAmount" decimal(15,2) NOT NULL,
  "commissionRate" decimal(5,2) NOT NULL,
  "commissionAmount" decimal(15,2) NOT NULL,
  "status" varchar NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP,
  "paymentReference" character varying,
  "metadata" jsonb DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_broker_commissions" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_broker_status" ON "broker_commissions" ("brokerId", "status");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_load" ON "broker_commissions" ("loadId");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_tenant_created" ON "broker_commissions" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_status_created" ON "broker_commissions" ("status", "createdAt");

-- Add foreign key constraints
ALTER TABLE "broker_commissions"
ADD CONSTRAINT IF NOT EXISTS "FK_broker_commissions_broker"
FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "broker_commissions"
ADD CONSTRAINT IF NOT EXISTS "FK_broker_commissions_load"
FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;

ALTER TABLE "broker_commissions"
ADD CONSTRAINT IF NOT EXISTS "FK_broker_commissions_tenant"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;