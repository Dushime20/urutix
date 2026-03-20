/**
 * Check Credit Transactions
 * Debug script to verify credit transactions are being recorded
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkTransactions() {
  console.log('🔍 Checking Credit Transactions...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Check all credit transactions
    console.log('1️⃣  All Credit Transactions:');
    const allTransactions = await client.query(`
      SELECT 
        ct.*,
        t.name as tenant_name
      FROM credit_transactions ct
      JOIN tenants t ON t.id = ct.tenant_id
      ORDER BY ct.created_at DESC
      LIMIT 20
    `);
    
    if (allTransactions.rows.length === 0) {
      console.log('❌ No credit transactions found in database!\n');
    } else {
      console.log(`✅ Found ${allTransactions.rows.length} transactions (showing last 20):\n`);
      allTransactions.rows.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.tenant_name}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Amount: ${tx.amount}`);
        console.log(`   Balance After: ${tx.balance_after}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Created: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 2. Check transactions by type
    console.log('2️⃣  Transactions by Type:');
    const byType = await client.query(`
      SELECT type, COUNT(*) as count, SUM(amount) as total_amount
      FROM credit_transactions
      GROUP BY type
      ORDER BY count DESC
    `);
    
    if (byType.rows.length > 0) {
      byType.rows.forEach(row => {
        console.log(`   ${row.type}: ${row.count} transactions, Total: ${row.total_amount}`);
      });
      console.log('');
    }

    // 3. Check credit accounts
    console.log('3️⃣  Credit Accounts:');
    const accounts = await client.query(`
      SELECT 
        ca.*,
        t.name as tenant_name
      FROM credit_accounts ca
      JOIN tenants t ON t.id = ca.tenant_id
      ORDER BY ca.current_balance DESC
      LIMIT 10
    `);
    
    console.log(`Found ${accounts.rows.length} credit accounts:\n`);
    accounts.rows.forEach(acc => {
      console.log(`   ${acc.tenant_name}:`);
      console.log(`     Current Balance: ${acc.current_balance}`);
      console.log(`     Subscription Credits: ${acc.subscription_credits}`);
      console.log(`     Purchased Credits: ${acc.purchased_credits}`);
      console.log(`     Bonus Credits: ${acc.bonus_credits}`);
      console.log(`     Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`     Lifetime Spent: ${acc.lifetime_spent}`);
      console.log('');
    });

    // 4. Check if there are any BONUS type transactions
    console.log('4️⃣  Bonus Credit Transactions:');
    const bonusTransactions = await client.query(`
      SELECT 
        ct.*,
        t.name as tenant_name
      FROM credit_transactions ct
      JOIN tenants t ON t.id = ct.tenant_id
      WHERE ct.type = 'BONUS'
      ORDER BY ct.created_at DESC
      LIMIT 10
    `);
    
    if (bonusTransactions.rows.length === 0) {
      console.log('ℹ️  No bonus credit transactions found');
      console.log('   This means no credits have been added via the admin panel yet\n');
    } else {
      console.log(`✅ Found ${bonusTransactions.rows.length} bonus transactions:\n`);
      bonusTransactions.rows.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.tenant_name}: +${tx.amount} credits`);
        console.log(`   Reason: ${tx.description}`);
        console.log(`   Date: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 5. Check transaction types enum
    console.log('5️⃣  Available Transaction Types:');
    const enumTypes = await client.query(`
      SELECT unnest(enum_range(NULL::credit_transaction_type)) as type
    `);
    
    console.log('   Supported types:');
    enumTypes.rows.forEach(row => {
      console.log(`     - ${row.type}`);
    });
    console.log('');

    console.log('='.repeat(60));
    console.log('💡 Summary:\n');
    console.log(`Total Transactions: ${allTransactions.rows.length}`);
    console.log(`Bonus Transactions: ${bonusTransactions.rows.length}`);
    console.log(`Credit Accounts: ${accounts.rows.length}`);
    console.log('');

    if (allTransactions.rows.length === 0) {
      console.log('⚠️  No transactions found. This could mean:');
      console.log('   1. Credits haven\'t been added yet via admin panel');
      console.log('   2. No trips have been completed yet');
      console.log('   3. The credit service might not be working correctly');
      console.log('');
      console.log('💡 To test:');
      console.log('   1. Add credits via admin panel: POST /api/admin/credits/add');
      console.log('   2. Check if transaction is created');
      console.log('   3. View in frontend: /admin/billing (History tab)');
    }

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Check complete\n');
  }
}

checkTransactions();
