-- Distribution campaigns: cargo-owner intent → child loads
CREATE TABLE IF NOT EXISTS "distribution_campaigns" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  "cargoOwnerId" uuid NOT NULL,
  "status" character varying(32) NOT NULL DEFAULT 'DRAFT',
  "productName" character varying(200) NOT NULL,
  "totalUnits" integer NOT NULL,
  "intent" jsonb NOT NULL,
  "plan" jsonb,
  "loadIds" jsonb NOT NULL DEFAULT '[]',
  "execution" jsonb NOT NULL DEFAULT '{}',
  "approvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "PK_distribution_campaigns" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_distribution_campaigns_owner"
  ON "distribution_campaigns" ("tenantId", "cargoOwnerId", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_distribution_campaigns_status"
  ON "distribution_campaigns" ("tenantId", "status");
