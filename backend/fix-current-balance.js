const { Client } = require('pg');
require('dotenv').config();

async function fixCurrentBalance() {
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

    console.log('=== RECALCULATING CURRENT_BALANCE FOR TENANT ADMIN ===\n');

    // Get account info
    const accountResult = await client.query(`
      SELECT 
        current_balance,
        lifetime_earned,
        lifetime_spent,
        subscription_credits,
        purchased_credits,
        bonus_credits
      FROM credit_accounts
      WHERE user_id = $1 AND tenant_id = $2
    `, [tenantAdminId, tenantId]);

    const account = accountResult.rows[0];
    console.log('Current Account State:');
    console.log(`  Current Balance: ${account.current_balance}`);
    console.log(`  Lifetime Earned: ${account.lifetime_earned}`);
    console.log(`  Lifetime Spent: ${account.lifetime_spent}`);
    console.log(`  Subscription Credits: ${account.subscription_credits}`);
    console.log(`  Purchased Credits: ${account.purchased_credits}`);
    console.log(`  Bonus Credits: ${account.bonus_credits}`);

    // Calculate correct balance
    const correctBalance = account.lifetime_earned - account.lifetime_spent;
    console.log(`\nCalculated Correct Balance: ${account.lifetime_earned} - ${account.lifetime_spent} = ${correctBalance}`);

    if (correctBalance !== account.current_balance) {
      console.log(`\n⚠️  MISMATCH DETECTED!`);
      console.log(`   Expected: ${correctBalance}`);
      console.log(`   Actual: ${account.current_balance}`);
      console.log(`   Difference: ${account.current_balance - correctBalance}`);
      
      console.log(`\n🔧 Fixing current_balance...`);
      
      await client.query(`
        UPDATE credit_accounts
        SET current_balance = $1
        WHERE user_id = $2 AND tenant_id = $3
      `, [correctBalance, tenantAdminId, tenantId]);
      
      console.log(`✅ Fixed! current_balance updated to ${correctBalance}`);
      
      // Verify
      const verifyResult = await client.query(`
        SELECT current_balance, lifetime_earned, lifetime_spent
        FROM credit_accounts
        WHERE user_id = $1 AND tenant_id = $2
      `, [tenantAdminId, tenantId]);
      
      const updated = verifyResult.rows[0];
      console.log(`\nVerification:`);
      console.log(`  Current Balance: ${updated.current_balance}`);
      console.log(`  Lifetime Earned: ${updated.lifetime_earned}`);
      console.log(`  Lifetime Spent: ${updated.lifetime_spent}`);
      console.log(`  Calculation: ${updated.lifetime_earned} - ${updated.lifetime_spent} = ${updated.lifetime_earned - updated.lifetime_spent}`);
      
      if (updated.lifetime_earned - updated.lifetime_spent === updated.current_balance) {
        console.log(`\n✅ All values are now consistent!`);
      }
    } else {
      console.log(`\n✅ current_balance is already correct!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixCurrentBalance();
