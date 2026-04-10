const { Client } = require('pg');
require('dotenv').config();

async function fixLifetimeSpent() {
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

    console.log('=== RECALCULATING LIFETIME_SPENT FOR TENANT ADMIN ===\n');

    // Calculate actual lifetime spent from transactions
    const result = await client.query(`
      SELECT 
        SUM(ABS(amount)) as total_spent
      FROM credit_transactions
      WHERE user_id = $1 
        AND tenant_id = $2
        AND type = 'CONSUMPTION'
    `, [tenantAdminId, tenantId]);

    const actualSpent = result.rows[0].total_spent || 0;
    console.log(`Actual spent from transactions: ${actualSpent} credits`);

    // Get current value
    const currentResult = await client.query(`
      SELECT lifetime_spent, current_balance, lifetime_earned
      FROM credit_accounts
      WHERE user_id = $1 AND tenant_id = $2
    `, [tenantAdminId, tenantId]);

    const current = currentResult.rows[0];
    console.log(`Current lifetime_spent in database: ${current.lifetime_spent} credits`);
    console.log(`Current balance: ${current.current_balance} credits`);
    console.log(`Lifetime earned: ${current.lifetime_earned} credits`);

    if (Number(actualSpent) !== Number(current.lifetime_spent)) {
      console.log(`\n⚠️  MISMATCH DETECTED!`);
      console.log(`   Expected: ${actualSpent}`);
      console.log(`   Actual: ${current.lifetime_spent}`);
      console.log(`   Difference: ${Number(current.lifetime_spent) - Number(actualSpent)}`);
      
      console.log(`\n🔧 Fixing lifetime_spent...`);
      
      await client.query(`
        UPDATE credit_accounts
        SET lifetime_spent = $1
        WHERE user_id = $2 AND tenant_id = $3
      `, [actualSpent, tenantAdminId, tenantId]);
      
      console.log(`✅ Fixed! lifetime_spent updated to ${actualSpent}`);
      
      // Verify
      const verifyResult = await client.query(`
        SELECT lifetime_spent, current_balance, lifetime_earned
        FROM credit_accounts
        WHERE user_id = $1 AND tenant_id = $2
      `, [tenantAdminId, tenantId]);
      
      const updated = verifyResult.rows[0];
      console.log(`\nVerification:`);
      console.log(`  Lifetime Spent: ${updated.lifetime_spent}`);
      console.log(`  Current Balance: ${updated.current_balance}`);
      console.log(`  Lifetime Earned: ${updated.lifetime_earned}`);
      console.log(`  Calculation: ${updated.lifetime_earned} - ${updated.lifetime_spent} = ${updated.lifetime_earned - updated.lifetime_spent}`);
      console.log(`  Should equal current balance: ${updated.current_balance}`);
      
      if (updated.lifetime_earned - updated.lifetime_spent === updated.current_balance) {
        console.log(`\n✅ All values are now consistent!`);
      } else {
        console.log(`\n⚠️  Warning: Values still don't match. May need to recalculate current_balance too.`);
      }
    } else {
      console.log(`\n✅ lifetime_spent is already correct!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixLifetimeSpent();
