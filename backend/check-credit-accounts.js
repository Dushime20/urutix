// Check credit accounts and transactions for tenant admin and truck owners
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

async function checkCreditAccounts() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get Demo Tenant ID
    const tenantResult = await client.query(`
      SELECT id, name FROM tenants WHERE name = 'Demo Tenant'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('Demo Tenant not found');
      return;
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`Demo Tenant ID: ${tenantId}\n`);

    // Get tenant admin
    const tenantAdminResult = await client.query(`
      SELECT id, email, role FROM users 
      WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'
    `, [tenantId]);

    if (tenantAdminResult.rows.length === 0) {
      console.log('Tenant admin not found');
      return;
    }

    const tenantAdmin = tenantAdminResult.rows[0];
    console.log(`Tenant Admin: ${tenantAdmin.email} (${tenantAdmin.id})\n`);

    // Get tenant admin's credit account
    const tenantAdminAccountResult = await client.query(`
      SELECT * FROM credit_accounts 
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, tenantAdmin.id]);

    if (tenantAdminAccountResult.rows.length > 0) {
      const account = tenantAdminAccountResult.rows[0];
      console.log('Tenant Admin Credit Account:');
      console.log(`  - Current Balance: ${account.current_balance}`);
      console.log(`  - Lifetime Earned: ${account.lifetime_earned}`);
      console.log(`  - Lifetime Spent: ${account.lifetime_spent}`);
      console.log('');

      // Get tenant admin's transactions
      const transactionsResult = await client.query(`
        SELECT 
          type,
          amount,
          balance_after,
          description,
          reference_type,
          created_at
        FROM credit_transactions
        WHERE tenant_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 10
      `, [tenantId, tenantAdmin.id]);

      console.log(`Tenant Admin Recent Transactions (${transactionsResult.rows.length}):`);
      transactionsResult.rows.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.type} - ${tx.amount} credits`);
        console.log(`     Description: ${tx.description}`);
        console.log(`     Balance After: ${tx.balance_after}`);
        console.log(`     Reference: ${tx.reference_type}`);
        console.log(`     Date: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('Tenant Admin has no credit account\n');
    }

    // Get all truck owners with active subscriptions
    const truckOwnersResult = await client.query(`
      SELECT DISTINCT
        u.id,
        u.email,
        u.role,
        ts.id as subscription_id,
        sp.name as plan_name,
        sp.credit_cost_per_partner,
        ts.status
      FROM users u
      INNER JOIN tenant_subscriptions ts ON u.id = ts.user_id
      INNER JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE u."tenantId" = $1 
        AND u.role = 'TRUCK_OWNER'
        AND ts.status = 'active'
      ORDER BY u.email
    `, [tenantId]);

    console.log(`\n=== Truck Owners with Active Subscriptions (${truckOwnersResult.rows.length}) ===\n`);

    for (const truckOwner of truckOwnersResult.rows) {
      console.log(`Truck Owner: ${truckOwner.email}`);
      console.log(`  - Plan: ${truckOwner.plan_name}`);
      console.log(`  - Credits Purchased: ${truckOwner.credit_cost_per_partner}`);

      // Get credit account
      const accountResult = await client.query(`
        SELECT * FROM credit_accounts 
        WHERE tenant_id = $1 AND user_id = $2
      `, [tenantId, truckOwner.id]);

      if (accountResult.rows.length > 0) {
        const account = accountResult.rows[0];
        console.log(`  - Current Balance: ${account.current_balance}`);
        console.log(`  - Lifetime Earned: ${account.lifetime_earned}`);
        console.log(`  - Lifetime Spent: ${account.lifetime_spent}`);

        // Get recent transactions
        const transactionsResult = await client.query(`
          SELECT 
            type,
            amount,
            balance_after,
            description,
            reference_type,
            created_at
          FROM credit_transactions
          WHERE tenant_id = $1 AND user_id = $2
          ORDER BY created_at DESC
          LIMIT 5
        `, [tenantId, truckOwner.id]);

        if (transactionsResult.rows.length > 0) {
          console.log(`  - Recent Transactions (${transactionsResult.rows.length}):`);
          transactionsResult.rows.forEach((tx, i) => {
            console.log(`    ${i + 1}. ${tx.type}: ${tx.amount} credits - ${tx.description.substring(0, 50)}...`);
          });
        }
      } else {
        console.log('  - No credit account found');
      }
      console.log('');
    }

    // Check for any BID-related transactions
    console.log('\n=== All BID-Related Transactions ===\n');
    const bidTransactionsResult = await client.query(`
      SELECT 
        u.email,
        u.role,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.created_at
      FROM credit_transactions ct
      INNER JOIN users u ON ct.user_id = u.id
      WHERE ct.tenant_id = $1 
        AND ct.reference_type = 'BID'
      ORDER BY ct.created_at DESC
    `, [tenantId]);

    if (bidTransactionsResult.rows.length > 0) {
      bidTransactionsResult.rows.forEach((tx, i) => {
        console.log(`${i + 1}. ${tx.email} (${tx.role})`);
        console.log(`   ${tx.type}: ${tx.amount} credits`);
        console.log(`   ${tx.description}`);
        console.log(`   Balance After: ${tx.balance_after}`);
        console.log(`   Date: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('No BID-related transactions found');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkCreditAccounts().catch(console.error);
