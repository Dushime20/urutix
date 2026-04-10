const { Client } = require('pg');
require('dotenv').config();

async function checkTenantAdminTransactions() {
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

    const tenantAdminId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';

    console.log('=== TENANT ADMIN CREDIT TRANSACTIONS ===');
    console.log('User: tenantadmin@demo.com');
    console.log(`User ID: ${tenantAdminId}\n`);

    // Get all transactions for tenant admin
    const result = await client.query(`
      SELECT 
        ct.id,
        ct.created_at,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.reference_type,
        ct.reference_id,
        ct.metadata
      FROM credit_transactions ct
      WHERE ct.user_id = $1 AND ct.tenant_id = $2
      ORDER BY ct.created_at ASC
    `, [tenantAdminId, tenantId]);

    console.log(`Found ${result.rows.length} transactions:\n`);

    let runningTotal = 0;
    result.rows.forEach((tx, idx) => {
      console.log(`Transaction ${idx + 1}:`);
      console.log(`  Time: ${tx.created_at}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount} credits`);
      console.log(`  Balance After: ${tx.balance_after}`);
      console.log(`  Description: ${tx.description}`);
      if (tx.reference_type) {
        console.log(`  Reference: ${tx.reference_type} - ${tx.reference_id}`);
      }
      if (tx.metadata && Object.keys(tx.metadata).length > 0) {
        console.log(`  Metadata:`, JSON.stringify(tx.metadata, null, 2));
      }
      
      runningTotal += tx.amount;
      console.log(`  Running Total Spent: ${Math.abs(runningTotal)} credits`);
      console.log('');
    });

    // Get current balance
    const balanceResult = await client.query(`
      SELECT 
        current_balance,
        subscription_credits,
        lifetime_earned,
        lifetime_spent
      FROM credit_accounts
      WHERE user_id = $1 AND tenant_id = $2
    `, [tenantAdminId, tenantId]);

    if (balanceResult.rows.length > 0) {
      const account = balanceResult.rows[0];
      console.log('=== CURRENT ACCOUNT STATUS ===');
      console.log(`Current Balance: ${account.current_balance} credits`);
      console.log(`Subscription Credits: ${account.subscription_credits} credits`);
      console.log(`Lifetime Earned: ${account.lifetime_earned} credits`);
      console.log(`Lifetime Spent: ${account.lifetime_spent} credits`);
      console.log('');
      console.log(`Calculation Check: ${account.lifetime_earned} - ${account.lifetime_spent} = ${account.lifetime_earned - account.lifetime_spent}`);
      console.log(`Should equal current balance: ${account.current_balance}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTenantAdminTransactions();
