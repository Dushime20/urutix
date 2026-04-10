const { Client } = require('pg');
require('dotenv').config();

async function checkRecentTransactions() {
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

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464'; // Demo Tenant

    // Check recent credit transactions
    console.log('=== RECENT CREDIT TRANSACTIONS (Last 10) ===\n');
    const transactionsResult = await client.query(`
      SELECT 
        ct.id,
        ct.created_at,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.reference_type,
        ct.reference_id,
        ct.user_id,
        u.email as user_email
      FROM credit_transactions ct
      LEFT JOIN users u ON ct.user_id = u.id
      WHERE ct.tenant_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 10
    `, [tenantId]);

    if (transactionsResult.rows.length === 0) {
      console.log('No transactions found');
    } else {
      transactionsResult.rows.forEach((tx, idx) => {
        console.log(`Transaction ${idx + 1}:`);
        console.log(`  Time: ${tx.created_at}`);
        console.log(`  User: ${tx.user_email || 'N/A (tenant-level)'}`);
        console.log(`  Type: ${tx.type}`);
        console.log(`  Amount: ${tx.amount} credits`);
        console.log(`  Balance After: ${tx.balance_after}`);
        console.log(`  Description: ${tx.description}`);
        console.log(`  Reference: ${tx.reference_type} - ${tx.reference_id || 'N/A'}`);
        console.log('');
      });
    }

    // Check recent bids
    console.log('\n=== RECENT BIDS (Last 5) ===\n');
    const bidsResult = await client.query(`
      SELECT 
        b.id,
        b."createdAt",
        b.status,
        b."bidAmount",
        b."truckOwnerId",
        b."loadId",
        l.title as load_title,
        l.weight as load_weight,
        u.email as truck_owner_email
      FROM bids b
      LEFT JOIN loads l ON b."loadId" = l.id
      LEFT JOIN users u ON b."truckOwnerId" = u.id
      WHERE l."tenantId" = $1
      ORDER BY b."createdAt" DESC
      LIMIT 5
    `, [tenantId]);

    if (bidsResult.rows.length === 0) {
      console.log('No bids found');
    } else {
      bidsResult.rows.forEach((bid, idx) => {
        console.log(`Bid ${idx + 1}:`);
        console.log(`  Time: ${bid.createdAt}`);
        console.log(`  Status: ${bid.status}`);
        console.log(`  Truck Owner: ${bid.truck_owner_email}`);
        console.log(`  Load: ${bid.load_title} (${bid.load_weight} kg)`);
        console.log(`  Bid Amount: $${bid.bidAmount}`);
        console.log(`  Bid ID: ${bid.id}`);
        console.log('');
      });
    }

    // Check current balances
    console.log('\n=== CURRENT CREDIT BALANCES ===\n');
    const balancesResult = await client.query(`
      SELECT 
        u.email,
        ca.current_balance,
        ca.subscription_credits,
        ca.purchased_credits,
        ca.lifetime_spent
      FROM credit_accounts ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.tenant_id = $1
      ORDER BY u.email
    `, [tenantId]);

    balancesResult.rows.forEach(row => {
      console.log(`${row.email}:`);
      console.log(`  Current Balance: ${row.current_balance} credits`);
      console.log(`  Subscription: ${row.subscription_credits}`);
      console.log(`  Purchased: ${row.purchased_credits}`);
      console.log(`  Lifetime Spent: ${row.lifetime_spent}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkRecentTransactions();
