const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'urutix',
});

async function createBrokerCommissionsTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create the table
    await client.query(`
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
    `);

    console.log('✅ broker_commissions table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_broker_status" ON "broker_commissions" ("brokerId", "status");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_load" ON "broker_commissions" ("loadId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_commissions_tenant_created" ON "broker_commissions" ("tenantId", "createdAt");
    `);

    console.log('✅ Indexes created');

    // Add foreign key constraints
    await client.query(`
      ALTER TABLE "broker_commissions"
      ADD CONSTRAINT IF NOT EXISTS "FK_broker_commissions_broker"
      FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
    `);

    await client.query(`
      ALTER TABLE "broker_commissions"
      ADD CONSTRAINT IF NOT EXISTS "FK_broker_commissions_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    `);

    console.log('✅ Foreign key constraints added');
    console.log('✅ broker_commissions table setup complete!');

  } catch (error) {
    console.error('Error creating broker_commissions table:', error);
  } finally {
    await client.end();
  }
}

createBrokerCommissionsTable();