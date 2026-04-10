const { Client } = require('pg');
require('dotenv').config();

async function debugSubscriptionQuery() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Test the exact query used in the code
    const truckOwnerId = 'ba42dac0-275d-4657-b18c-8ec03c685537'; // truckowner5
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464'; // Demo Tenant
    
    console.log('Testing query for truckowner5@demo.com');
    console.log(`User ID: ${truckOwnerId}`);
    console.log(`Tenant ID: ${tenantId}\n`);

    // Query 1: Check with lowercase 'active'
    console.log('=== Query 1: status = \'active\' (lowercase) ===');
    const result1 = await client.query(`
      SELECT 
        ts.id,
        ts.status,
        ts.user_id,
        ts.tenant_id,
        ts.plan_id,
        sp.name as plan_name,
        sp.slug as plan_slug
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.user_id = $1 
        AND ts.tenant_id = $2 
        AND ts.status = 'active'
    `, [truckOwnerId, tenantId]);
    
    console.log(`Found ${result1.rows.length} subscription(s)`);
    if (result1.rows.length > 0) {
      console.log('Subscription:', result1.rows[0]);
    }

    // Query 2: Check with uppercase 'ACTIVE'
    console.log('\n=== Query 2: status = \'ACTIVE\' (uppercase) ===');
    const result2 = await client.query(`
      SELECT 
        ts.id,
        ts.status,
        ts.user_id,
        ts.tenant_id,
        ts.plan_id,
        sp.name as plan_name,
        sp.slug as plan_slug
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.user_id = $1 
        AND ts.tenant_id = $2 
        AND ts.status = 'ACTIVE'
    `, [truckOwnerId, tenantId]);
    
    console.log(`Found ${result2.rows.length} subscription(s)`);
    if (result2.rows.length > 0) {
      console.log('Subscription:', result2.rows[0]);
    }

    // Query 3: Check without status filter
    console.log('\n=== Query 3: No status filter ===');
    const result3 = await client.query(`
      SELECT 
        ts.id,
        ts.status,
        ts.user_id,
        ts.tenant_id,
        ts.plan_id,
        sp.name as plan_name,
        sp.slug as plan_slug
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.user_id = $1 
        AND ts.tenant_id = $2
    `, [truckOwnerId, tenantId]);
    
    console.log(`Found ${result3.rows.length} subscription(s)`);
    if (result3.rows.length > 0) {
      result3.rows.forEach((row, idx) => {
        console.log(`\nSubscription ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Status: '${row.status}' (length: ${row.status.length})`);
        console.log(`  Plan: ${row.plan_name}`);
      });
    }

    // Check the enum definition
    console.log('\n=== Checking subscription_status enum ===');
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'subscription_status'
      )
    `);
    
    console.log('Enum values:');
    enumResult.rows.forEach(row => {
      console.log(`  - '${row.enumlabel}'`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugSubscriptionQuery();
