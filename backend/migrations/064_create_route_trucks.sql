-- Migration: 064_create_route_trucks
-- Description: Create route_trucks junction table for truck-to-route assignments.
--              Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "route_trucks" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "routeId" uuid NOT NULL,
  "truckId" uuid NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_468d75203232a52d433c4eb12b0" UNIQUE ("tenantId", "routeId", "truckId"),
  CONSTRAINT "PK_eb8d8d94a28bcfe6d970802e578" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_941d32f73977001a50bf372375" ON "route_trucks" ("tenantId");
CREATE INDEX IF NOT EXISTS "IDX_041e5b92be1fd246f112c85e41" ON "route_trucks" ("truckId");
CREATE INDEX IF NOT EXISTS "IDX_09edcc3902bee3dcf05426e3d2" ON "route_trucks" ("routeId");
CREATE INDEX IF NOT EXISTS "IDX_1295fe8acbf4dd97725a724515" ON "route_trucks" ("tenantId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "route_trucks"
    ADD CONSTRAINT "FK_09edcc3902bee3dcf05426e3d2d"
    FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
