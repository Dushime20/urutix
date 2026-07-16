-- =============================================================================
-- Migration 055: Align auction_watches + auction_views with TypeORM entities
-- =============================================================================
-- ROOT CAUSE
-- ----------
-- 000_base_schema.sql created minimal tables missing tenantId and other columns
-- expected by AuctionWatch / AuctionView entities. Production fails with:
--   column AuctionWatch.tenantId does not exist
-- (GET /api/bidding/auctions watch/view counts)
--
-- SAFE / IDEMPOTENT: ADD COLUMN IF NOT EXISTS + backfill tenantId.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== AUCTION_WATCHES ====================

ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "tenantId" uuid;
ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb
  NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}'::jsonb;
ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "auction_watches" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now();

UPDATE "auction_watches" aw
SET "tenantId" = COALESCE(
  (
    SELECT l."tenantId"
    FROM "auctions" a
    JOIN "loads" l ON l.id = a."loadId"
    WHERE a.id = aw."auctionId"
    LIMIT 1
  ),
  (
    SELECT u."tenantId"
    FROM "users" u
    WHERE u.id = aw."watcherId"
    LIMIT 1
  )
)
WHERE aw."tenantId" IS NULL;

DELETE FROM "auction_watches" WHERE "tenantId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "auction_watches" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'auction_watches.tenantId NOT NULL skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_auction_watches_tenant_active"
  ON "auction_watches" ("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "IDX_auction_watches_auction"
  ON "auction_watches" ("auctionId");
CREATE INDEX IF NOT EXISTS "IDX_auction_watches_watcher"
  ON "auction_watches" ("watcherId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_auction_watches_auction'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'auctions'
  ) THEN
    ALTER TABLE "auction_watches"
      ADD CONSTRAINT "FK_auction_watches_auction"
      FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_auction_watches_watcher'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
  ) THEN
    ALTER TABLE "auction_watches"
      ADD CONSTRAINT "FK_auction_watches_watcher"
      FOREIGN KEY ("watcherId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ==================== AUCTION_VIEWS ====================

ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "tenantId" uuid;
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "viewerId" uuid;
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "ipAddress" character varying(45);
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "userAgent" text;
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "referrer" text;
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "sessionId" character varying(255);
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE "auction_views" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();

UPDATE "auction_views" av
SET "tenantId" = COALESCE(
  (
    SELECT l."tenantId"
    FROM "auctions" a
    JOIN "loads" l ON l.id = a."loadId"
    WHERE a.id = av."auctionId"
    LIMIT 1
  ),
  (
    SELECT u."tenantId"
    FROM "users" u
    WHERE u.id = av."viewerId"
    LIMIT 1
  )
)
WHERE av."tenantId" IS NULL;

DELETE FROM "auction_views" WHERE "tenantId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "auction_views" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'auction_views.tenantId NOT NULL skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_auction_views_tenant_viewed"
  ON "auction_views" ("tenantId", "viewedAt");
CREATE INDEX IF NOT EXISTS "IDX_auction_views_auction"
  ON "auction_views" ("auctionId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_auction_views_auction'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'auctions'
  ) THEN
    ALTER TABLE "auction_views"
      ADD CONSTRAINT "FK_auction_views_auction"
      FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_auction_views_viewer'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
  ) THEN
    ALTER TABLE "auction_views"
      ADD CONSTRAINT "FK_auction_views_viewer"
      FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "auction_watches" IS 'Users watching auctions; tenantId required for scoped counts';
COMMENT ON TABLE "auction_views" IS 'Auction view events; tenantId required for scoped analytics';
