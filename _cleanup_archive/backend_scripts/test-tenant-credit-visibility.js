const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testTenantCreditVisibility() {
  try {
    console.log('🔍 Testing Tenant Credit Visibility...\n');

    // Get a sample tenant
    const tenantResult = await pool.query(`
      SELECT id, name, "contactEmail"
      FROM tenants
      WHERE status = 'ACTIVE'
      LIMIT 1
    `);

    if (tenantResult.rows.length === 0) {
      console.log('❌ No active tenants found');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(`📋 Testing with tenant: ${tenant.name} (${tenant.id})\n`);

    // Check tenant-level credit account
    const tenantAccountResult = await pool.query(`
      SELECT *
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id IS NULL
    `, [tenant.id]);

    console.log('🏢 TENANT-LEVEL ACCOUNT (Master Balance):');
    console.log('==========================================');
    if (tenantAccountResult.rows.length > 0) {
      const acc = tenantAccountResult.rows[0];
      console.log(`  ✅ Account exists`);
      console.log(`  Balance: ${acc.current_balance} credits`);
      console.log(`  Purchased: ${acc.purchased_credits}`);
      console.log(`  Bonus: ${acc.bonus_credits}`);
      console.log(`  Subscription: ${acc.subscription_credits}`);
    } else {
      console.log(`  ❌ No tenant-level account found!`);
      console.log(`  This account should be created when admin gives credits to tenant.`);
    }

    // Check tenant admin user
    const adminResult = await pool.query(`
      SELECT id, email, role
      FROM users
      WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'
      LIMIT 1
    `, [tenant.id]);

    console.log('\n👤 TENANT ADMIN USER:');
    console.log('=====================');
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  User ID: ${admin.id}`);
      
      // Check if admin has a user-level account (they shouldn't need one)
      const adminAccountResult = await pool.query(`
        SELECT *
        FROM credit_accounts
        WHERE tenant_id = $1 AND user_id = $2
      `, [tenant.id, admin.id]);
      
      if (adminAccountResult.rows.length > 0) {
        console.log(`  ⚠️  Admin has a user-level account (not needed)`);
      } else {
        console.log(`  ✅ Admin uses tenant-level account (correct)`);
      }
    } else {
      console.log(`  ❌ No tenant admin found`);
    }

    // Check recent transactions for this tenant
    console.log('\n📝 Recent Tenant Transactions:');
    console.log('==============================');
    const transactionsResult = await pool.query(`
      SELECT 
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.created_at
      FROM credit_transactions ct
      WHERE ct.tenant_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 5
    `, [tenant.id]);

    if (transactionsResult.rows.length > 0) {
      transactionsResult.rows.forEach(tx => {
        console.log(`  ${tx.created_at.toISOString().split('T')[0]} - ${tx.type}`);
        console.log(`    Amount: ${tx.amount}, Balance After: ${tx.balance_after}`);
        console.log(`    ${tx.description}`);
      });
    } else {
      console.log(`  No transactions found`);
    }

    console.log('\n💡 HOW IT SHOULD WORK:');
    console.log('======================');
    console.log('1. Super Admin gives credits to tenant → Creates/updates tenant-level account');
    console.log('2. Tenant Admin logs in → Sees tenant-level balance via /credits/balance');
    console.log('3. Tenant Admin transfers to truck owner → Creates user-level account for truck owner');
    console.log('4. Truck Owner logs in → Sees their user-level balance via /credits/balance');
    console.log('');
    console.log('✅ The /credits/balance endpoint now checks user role:');
    console.log('   - TRUCK_OWNER → fetches user-level account');
    console.log('   - TENANT_ADMIN → fetches tenant-level account');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testTenantCreditVisibility();
