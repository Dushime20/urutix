const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function diagnoseCreditScopes() {
  try {
    console.log('🔍 Diagnosing Credit Scope Issue...\n');

    // Get all credit accounts
    const accountsResult = await pool.query(`
      SELECT 
        ca.id,
        ca."tenantId",
        ca."userId",
        ca."currentBalance",
        ca."purchasedCredits",
        ca."bonusCredits",
        t."companyName" as tenant_name,
        u.email as user_email,
        u.role as user_role
      FROM credit_accounts ca
      LEFT JOIN tenants t ON ca."tenantId" = t.id
      LEFT JOIN users u ON ca."userId" = u.id
      ORDER BY ca."tenantId", ca."userId" NULLS FIRST
    `);

    console.log(`📊 Found ${accountsResult.rows.length} credit accounts:\n`);

    const tenantAccounts = accountsResult.rows.filter(a => !a.userId);
    const userAccounts = accountsResult.rows.filter(a => a.userId);

    console.log('🏢 TENANT-LEVEL ACCOUNTS (Master Balance):');
    console.log('==========================================');
    tenantAccounts.forEach(acc => {
      console.log(`  Tenant: ${acc.tenant_name || acc.tenantId}`);
      console.log(`  Balance: ${acc.currentBalance} credits`);
      console.log(`  Purchased: ${acc.purchasedCredits}`);
      console.log(`  Bonus: ${acc.bonusCredits}`);
      console.log('');
    });

    console.log('\n👤 USER-LEVEL ACCOUNTS (Truck Owner Balances):');
    console.log('===============================================');
    userAccounts.forEach(acc => {
      console.log(`  User: ${acc.user_email} (${acc.user_role})`);
      console.log(`  Tenant: ${acc.tenant_name || acc.tenantId}`);
      console.log(`  Balance: ${acc.currentBalance} credits`);
      console.log(`  Purchased: ${acc.purchasedCredits}`);
      console.log(`  Bonus: ${acc.bonusCredits}`);
      console.log('');
    });

    // Check recent transactions
    console.log('\n📝 Recent Credit Transactions:');
    console.log('==============================');
    const transactionsResult = await pool.query(`
      SELECT 
        ct.id,
        ct."tenantId",
        ct."userId",
        ct.type,
        ct.amount,
        ct."balanceAfter",
        ct.description,
        ct."createdAt",
        u.email as user_email
      FROM credit_transactions ct
      LEFT JOIN users u ON ct."userId" = u.id
      ORDER BY ct."createdAt" DESC
      LIMIT 10
    `);

    transactionsResult.rows.forEach(tx => {
      console.log(`  ${tx.createdAt.toISOString()}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  User: ${tx.user_email || 'TENANT-LEVEL'}`);
      console.log(`  Description: ${tx.description}`);
      console.log(`  Balance After: ${tx.balanceAfter}`);
      console.log('');
    });

    console.log('\n💡 DIAGNOSIS:');
    console.log('=============');
    console.log('When an admin gives credits to a tenant, they go to the TENANT-LEVEL account.');
    console.log('Truck owners see their USER-LEVEL account balance.');
    console.log('');
    console.log('✅ SOLUTION:');
    console.log('The tenant admin must use the "Sell Credits" button to transfer credits');
    console.log('from the tenant master balance to individual truck owner accounts.');
    console.log('');
    console.log('This is working as designed - it allows the tenant to control credit distribution.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseCreditScopes();
