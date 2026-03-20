/**
 * Test Transactions API
 * Verify the transactions endpoint is returning data correctly
 */

const { Client } = require('pg');
require('dotenv').config();

async function testAPI() {
  console.log('🧪 Testing Transactions API...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Get a tenant with transactions
    const tenantWithTx = await client.query(`
      SELECT DISTINCT t.id, t.name, COUNT(ct.id) as tx_count
      FROM tenants t
      JOIN credit_transactions ct ON ct.tenant_id = t.id
      GROUP BY t.id, t.name
      ORDER BY tx_count DESC
      LIMIT 1
    `);

    if (tenantWithTx.rows.length === 0) {
      console.log('❌ No tenants with transactions found');
      return;
    }

    const tenant = tenantWithTx.rows[0];
    console.log(`✅ Testing with tenant: ${tenant.name} (${tenant.tx_count} transactions)\n`);

    // Get transactions for this tenant
    const transactions = await client.query(`
      SELECT *
      FROM credit_transactions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [tenant.id]);

    console.log(`📋 Transactions for ${tenant.name}:\n`);
    transactions.rows.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type}`);
      console.log(`   Amount: ${tx.amount}`);
      console.log(`   Balance After: ${tx.balance_after}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Created: ${new Date(tx.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('💡 API Endpoint Test:\n');
    console.log(`GET /api/credits/transactions`);
    console.log(`Authorization: Bearer <token for tenant: ${tenant.name}>`);
    console.log('');
    console.log('Expected Response:');
    console.log(JSON.stringify({
      success: true,
      data: transactions.rows.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balance_after,
        description: tx.description,
        createdAt: tx.created_at,
      })),
      pagination: {
        total: transactions.rows.length,
        limit: 50,
        offset: 0,
      }
    }, null, 2));
    console.log('');

    console.log('🔍 Frontend Check:');
    console.log('   1. Make sure you\'re logged in as the correct tenant');
    console.log(`   2. The tenant should be: ${tenant.name}`);
    console.log('   3. Navigate to: /admin/billing');
    console.log('   4. Click on "Transaction History" tab');
    console.log('   5. Check browser console for API errors');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.end();
  }
}

testAPI();
