const { Client } = require('pg');
require('dotenv').config();

async function checkAllCreditUpdates() {
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

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';

    console.log('=== ALL CREDIT TRANSACTIONS IN TENANT ===\n');

    const result = await client.query(`
      SELECT 
        ct.id,
        ct.created_at,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.user_id,
        u.email as user_email,
        ct.reference_type,
        ct.reference_id
      FROM credit_transactions ct
      LEFT JOIN users u ON ct.user_id = u.id
      WHERE ct.tenant_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 20
    `, [tenantId]);

    console.log(`Found ${result.rows.length} recent transactions:\n`);

    result.rows.forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.created_at.toISOString()}`);
      console.log(`   User: ${tx.user_email || 'N/A (tenant-level)'}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Amount: ${tx.amount}`);
      console.log(`   Balance After: ${tx.balance_after}`);
      console.log(`   Description: ${tx.description}`);
      if (tx.reference_type) {
        console.log(`   Reference: ${tx.reference_type} - ${tx.reference_id}`);
      }
      console.log('');
    });

    // Check for duplicate transactions
    console.log('\n=== CHECKING FOR DUPLICATE BID TRANSACTIONS ===\n');
    
    const duplicateCheck = await client.query(`
      SELECT 
        reference_id,
        COUNT(*) as count,
        SUM(ABS(amount)) as total_amount,
        array_agg(user_id) as user_ids,
        array_agg(amount) as amounts
      FROM credit_transactions
      WHERE tenant_id = $1 
        AND reference_type = 'BID'
        AND type = 'CONSUMPTION'
      GROUP BY reference_id
      HAVING COUNT(*) > 2
    `, [tenantId]);

    if (duplicateCheck.rows.length > 0) {
      console.log('⚠️  Found bids with more than 2 transactions (should be exactly 2: tenant + truck owner):');
      duplicateCheck.rows.forEach(row => {
        console.log(`  Bid ID: ${row.reference_id}`);
        console.log(`  Transaction Count: ${row.count}`);
        console.log(`  Total Amount: ${row.total_amount}`);
        console.log(`  User IDs: ${row.user_ids}`);
        console.log(`  Amounts: ${row.amounts}`);
        console.log('');
      });
    } else {
      console.log('✅ No duplicate transactions found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAllCreditUpdates();
