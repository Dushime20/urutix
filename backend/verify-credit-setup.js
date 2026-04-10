const { Client } = require('pg');
require('dotenv').config();

async function verifySetup() {
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

    const truckOwnerId = 'ba42dac0-275d-4657-b18c-8ec03c685537'; // truckowner5
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464'; // Demo Tenant

    console.log('=== VERIFICATION FOR TRUCKOWNER5@DEMO.COM ===\n');

    // 1. Check subscription
    console.log('1. Subscription Status:');
    const subResult = await client.query(`
      SELECT 
        ts.id,
        ts.status,
        sp.name as plan_name,
        sp.credits_per_ton_tenant,
        sp.credits_per_ton_truck_owner
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.user_id = $1 AND ts.tenant_id = $2 AND ts.status = 'active'
    `, [truckOwnerId, tenantId]);

    if (subResult.rows.length > 0) {
      console.log('   ✅ Active subscription found');
      console.log(`   Plan: ${subResult.rows[0].plan_name}`);
      console.log(`   Tenant rate: ${subResult.rows[0].credits_per_ton_tenant} credits/ton`);
      console.log(`   Truck owner rate: ${subResult.rows[0].credits_per_ton_truck_owner} credits/ton`);
    } else {
      console.log('   ❌ No active subscription');
    }

    // 2. Check credit account
    console.log('\n2. Credit Account:');
    const creditResult = await client.query(`
      SELECT 
        id,
        current_balance,
        subscription_credits,
        purchased_credits
      FROM credit_accounts
      WHERE user_id = $1 AND tenant_id = $2
    `, [truckOwnerId, tenantId]);

    if (creditResult.rows.length > 0) {
      const account = creditResult.rows[0];
      console.log('   ✅ Credit account found');
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Current balance: ${account.current_balance} credits`);
      console.log(`   Subscription credits: ${account.subscription_credits}`);
      console.log(`   Purchased credits: ${account.purchased_credits}`);
    } else {
      console.log('   ❌ No credit account');
    }

    // 3. Check tenant admin
    console.log('\n3. Tenant Admin:');
    const adminResult = await client.query(`
      SELECT id, email, role
      FROM users
      WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'
    `, [tenantId]);

    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('   ✅ Tenant admin found');
      console.log(`   Email: ${admin.email}`);
      console.log(`   User ID: ${admin.id}`);

      // Check tenant admin subscription
      const adminSubResult = await client.query(`
        SELECT 
          ts.id,
          ts.status,
          sp.name as plan_name,
          sp.credits_per_ton_tenant
        FROM tenant_subscriptions ts
        LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
        WHERE ts.user_id = $1 AND ts.tenant_id = $2 AND ts.status = 'active'
      `, [admin.id, tenantId]);

      if (adminSubResult.rows.length > 0) {
        console.log('   ✅ Tenant admin has active subscription');
        console.log(`   Plan: ${adminSubResult.rows[0].plan_name}`);
        console.log(`   Tenant rate: ${adminSubResult.rows[0].credits_per_ton_tenant} credits/ton`);
      } else {
        console.log('   ❌ Tenant admin has no active subscription');
      }

      // Check tenant admin credit account
      const adminCreditResult = await client.query(`
        SELECT current_balance
        FROM credit_accounts
        WHERE user_id = $1 AND tenant_id = $2
      `, [admin.id, tenantId]);

      if (adminCreditResult.rows.length > 0) {
        console.log(`   ✅ Tenant admin credit balance: ${adminCreditResult.rows[0].current_balance} credits`);
      } else {
        console.log('   ❌ Tenant admin has no credit account');
      }
    } else {
      console.log('   ❌ No tenant admin found');
    }

    // 4. Check if user_id column exists in credit_transactions
    console.log('\n4. Database Schema:');
    const schemaResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions' AND column_name = 'user_id'
    `);

    if (schemaResult.rows.length > 0) {
      console.log('   ✅ user_id column exists in credit_transactions');
    } else {
      console.log('   ❌ user_id column missing in credit_transactions');
    }

    console.log('\n=== READY FOR BIDDING ===');
    if (subResult.rows.length > 0 && creditResult.rows.length > 0 && 
        adminResult.rows.length > 0 && schemaResult.rows.length > 0) {
      console.log('✅ All requirements met! Truck owner can place bids.');
    } else {
      console.log('❌ Some requirements are missing. Check above for details.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

verifySetup();
