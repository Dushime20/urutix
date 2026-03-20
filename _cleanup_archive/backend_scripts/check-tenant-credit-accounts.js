const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTenantCreditAccounts() {
  try {
    console.log('=== CHECKING TENANT CREDIT ACCOUNTS ===\n');
    
    const tenantId = 'b7d244e3-9a1a-4686-a22f-3fe18468500e';
    
    // Get all credit accounts for this tenant
    const accountsResult = await pool.query(`
      SELECT 
        ca.id,
        ca.user_id,
        ca.current_balance,
        ca.purchased_credits,
        ca.subscription_credits,
        ca.bonus_credits,
        ca.lifetime_earned,
        ca.lifetime_spent,
        ca.created_at,
        u.email,
        u.role
      FROM credit_accounts ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.tenant_id = $1
      ORDER BY ca.created_at
    `, [tenantId]);
    
    console.log(`Found ${accountsResult.rows.length} credit accounts for tenant:\n`);
    
    accountsResult.rows.forEach((acc, i) => {
      console.log(`${i + 1}. Account ID: ${acc.id}`);
      console.log(`   User: ${acc.user_id ? `${acc.email} (${acc.role})` : 'TENANT MASTER ACCOUNT'}`);
      console.log(`   Current Balance: ${acc.current_balance} credits`);
      console.log(`   Purchased: ${acc.purchased_credits} credits`);
      console.log(`   Subscription: ${acc.subscription_credits} credits`);
      console.log(`   Bonus: ${acc.bonus_credits} credits`);
      console.log(`   Lifetime Earned: ${acc.lifetime_earned} credits`);
      console.log(`   Lifetime Spent: ${acc.lifetime_spent} credits`);
      console.log(`   Created: ${acc.created_at}`);
      console.log('');
    });
    
    // Get recent transactions
    console.log('Recent transactions:');
    const transactionsResult = await pool.query(`
      SELECT 
        ct.id,
        ct.type,
        ct.amount,
        ct.description,
        ct.created_at,
        ca.user_id,
        u.email
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.account_id = ca.id
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ct.tenant_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 10
    `, [tenantId]);
    
    transactionsResult.rows.forEach((tx, i) => {
      console.log(`${i + 1}. ${tx.type} - ${tx.amount} credits`);
      console.log(`   Account: ${tx.user_id ? `${tx.email}` : 'TENANT MASTER'}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Date: ${tx.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking tenant credit accounts:', error.message);
  } finally {
    await pool.end();
  }
}

checkTenantCreditAccounts();