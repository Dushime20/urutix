/**
 * Standalone migration runner — no TypeScript, no npx needed.
 * Run inside the container: node run-migration.js
 *
 * Applies all pending schema changes safely using IF NOT EXISTS / IF EXISTS.
 */

const { Client } = require('pg');

const client = new Client({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'urutix',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const migrations = [
  {
    name: 'add_trips_completedAt',
    sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP`,
  },
  {
    name: 'create_epod_status_enum',
    sql: `
      DO $$ BEGIN
        CREATE TYPE epod_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `,
  },
  {
    name: 'create_epods_table',
    sql: `
      CREATE TABLE IF NOT EXISTS epods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"             UUID NOT NULL,
        "tripId"               UUID NOT NULL UNIQUE,
        "driverId"             UUID NOT NULL,
        "cargoOwnerId"         UUID NOT NULL,
        "recipientName"        VARCHAR(200) NOT NULL,
        "recipientPhone"       VARCHAR(50),
        "signatureFileUrl"     VARCHAR(500),
        "photoUrls"            JSONB NOT NULL DEFAULT '[]',
        "deliveryNotes"        TEXT,
        "odometerReading"      VARCHAR(100),
        "deliveryAddress"      TEXT,
        "deliveryCoordinates"  JSONB,
        status                 epod_status_enum NOT NULL DEFAULT 'PENDING',
        "submittedAt"          TIMESTAMP WITH TIME ZONE NOT NULL,
        "confirmedAt"          TIMESTAMP WITH TIME ZONE,
        "invoiceId"            UUID,
        "createdAt"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'create_epods_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_epods_tenant_status ON epods ("tenantId", status);
      CREATE INDEX IF NOT EXISTS idx_epods_cargo_owner   ON epods ("cargoOwnerId");
    `,
  },
];

async function run() {
  await client.connect();
  console.log('✅ Connected to database');

  for (const m of migrations) {
    try {
      await client.query(m.sql);
      console.log(`✅ ${m.name}`);
    } catch (err) {
      console.error(`❌ ${m.name}: ${err.message}`);
      // Non-fatal — continue with remaining migrations
    }
  }

  await client.end();
  console.log('🎉 Migration complete');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
