// Fix the incorrect "Industrial material" transaction where tenant admin was charged 0 credits
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

async function fixIndustrialMaterialTransaction() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get Demo Tenant ID
    const tenantResult = await client.query(`
      SELECT id FROM tenants WHERE name = 'Demo Tenant'
    `);
    const tenantId = tenantResult.rows[0].id;

    // Get tenant admin
    const tenantAdminResult = await client.query(`
      SELECT id, email FROM users 
      WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'
    `, [tenantId]);
    const tenantAdmin = tenantAdminResult.rows[0];

    console.log(`Tenant Admin: ${tenantAdmin.email}\n`);

    // Find the incorrect transaction
    const incorrectTxResult = await client.query(`
      SELECT * FROM credit_transactions
      WHERE tenant_id = $1 
        AND user_id = $2
        AND description LIKE '%Industrial material%'
        AND amount = 0
      ORDER BY created_at DESC
      LIMIT 1
    `, [tenantId, tenantAdmin.id]);

    if (incorrectTxResult.rows.length === 0) {
      console.log('No incorrect transaction found for "Industrial material"');
      return;
    }

    const incorrectTx = incorrectTxResult.rows[0];
    console.log('Found incorrect transaction:');
    console.log(`  - ID: ${incorrectTx.id}`);
    console.log(`  - Description: ${incorrectTx.description}`);
    console.log(`  - Amount: ${incorrectTx.amount} (should be -16)`);
    console.log(`  - Balance After: ${incorrectTx.balance_after}`);
    console.log(`  - Created: ${new Date(incorrectTx.created_at).toLocaleString()}`);
    console.log('');

    // Calculate correct amount: 8 tons × 2 credits/ton = 16 credits
    const correctAmount = -16;
    const correctBalanceAfter = incorrectTx.balance_after + correctAmount; // 4992 - 16 = 4976

    console.log('Correction needed:');
    console.log(`  - Correct amount: ${correctAmount} credits`);
    console.log(`  - Correct balance after: ${correctBalanceAfter}`);
    console.log('');

    // Start transaction
    await client.query('BEGIN');

    try {
      // Update the transaction
      await client.query(`
        UPDATE credit_transactions
        SET 
          amount = $1,
          balance_after = $2,
          description = 'Bid accepted for "Industrial material" (8 tons × 2 credits/ton)',
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{corrected}',
            'true'::jsonb
          )
        WHERE id = $3
      `, [correctAmount, correctBalanceAfter, incorrectTx.id]);

      console.log('✓ Updated transaction');

      // Update credit account
      const accountResult = await client.query(`
        SELECT * FROM credit_accounts
        WHERE tenant_id = $1 AND user_id = $2
      `, [tenantId, tenantAdmin.id]);

      const account = accountResult.rows[0];
      const newLifetimeSpent = account.lifetime_spent + 16; // Add the 16 credits that should have been spent
      const newCurrentBalance = account.lifetime_earned - newLifetimeSpent;

      await client.query(`
        UPDATE credit_accounts
        SET 
          lifetime_spent = $1,
          current_balance = $2
        WHERE id = $3
      `, [newLifetimeSpent, newCurrentBalance, account.id]);

      console.log('✓ Updated credit account');
      console.log(`  - Old lifetime_spent: ${account.lifetime_spent}`);
      console.log(`  - New lifetime_spent: ${newLifetimeSpent}`);
      console.log(`  - Old current_balance: ${account.current_balance}`);
      console.log(`  - New current_balance: ${newCurrentBalance}`);
      console.log('');

      // Commit transaction
      await client.query('COMMIT');
      console.log('✓ Changes committed successfully');

      // Verify the fix
      console.log('\n=== Verification ===\n');
      
      const verifyTxResult = await client.query(`
        SELECT * FROM credit_transactions
        WHERE id = $1
      `, [incorrectTx.id]);
      
      const verifiedTx = verifyTxResult.rows[0];
      console.log('Updated Transaction:');
      console.log(`  - Description: ${verifiedTx.description}`);
      console.log(`  - Amount: ${verifiedTx.amount} credits`);
      console.log(`  - Balance After: ${verifiedTx.balance_after}`);
      console.log('');

      const verifyAccountResult = await client.query(`
        SELECT * FROM credit_accounts
        WHERE tenant_id = $1 AND user_id = $2
      `, [tenantId, tenantAdmin.id]);
      
      const verifiedAccount = verifyAccountResult.rows[0];
      console.log('Updated Credit Account:');
      console.log(`  - Current Balance: ${verifiedAccount.current_balance}`);
      console.log(`  - Lifetime Earned: ${verifiedAccount.lifetime_earned}`);
      console.log(`  - Lifetime Spent: ${verifiedAccount.lifetime_spent}`);
      console.log('');

      // Show all tenant admin transactions
      const allTxResult = await client.query(`
        SELECT 
          description,
          amount,
          balance_after,
          created_at
        FROM credit_transactions
        WHERE tenant_id = $1 AND user_id = $2
        ORDER BY created_at DESC
      `, [tenantId, tenantAdmin.id]);

      console.log('All Tenant Admin Transactions:');
      allTxResult.rows.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.amount} credits - ${tx.description.substring(0, 60)}`);
        console.log(`     Balance: ${tx.balance_after} | ${new Date(tx.created_at).toLocaleString()}`);
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixIndustrialMaterialTransaction().catch(console.error);
