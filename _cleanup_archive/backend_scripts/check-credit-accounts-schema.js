const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
  try {
    console.log('=== CHECKING CREDIT ACCOUNTS SCHEMA ===');
    
    // Check the actual schema of credit_accounts table
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'credit_accounts'
      ORDER BY ordinal_position
    `);
    
    console.log('Credit Accounts table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if there are any credit accounts
    const countResult = await pool.query('SELECT COUNT(*) as count FROM credit_accounts');
    console.log('\nTotal credit accounts in system:', countResult.rows[0].count);
    
    // Check a few sample records
    const sampleResult = await pool.query('SELECT * FROM credit_accounts LIMIT 3');
    console.log('\nSample credit accounts:');
    sampleResult.rows.forEach((account, index) => {
      console.log(`Account ${index + 1}:`, account);
    });
    
    // Get tenant ID for our admin
    const adminResult = await pool.query(`
      SELECT u."tenantId"
      FROM users u 
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
    `);
    
    if (adminResult.rows.length > 0) {
      const tenantId = adminResult.rows[0].tenantId;
      console.log('\nTenant ID:', tenantId);
      
      // Get truck owner IDs for this tenant
      const truckOwnersResult = await pool.query(`
        SELECT u.id, u.email
        FROM users u
        WHERE u."tenantId" = $1 AND u.role = 'TRUCK_OWNER'
      `, [tenantId]);
      
      console.log('\nTruck owners in tenant:');
      truckOwnersResult.rows.forEach(owner => {
        console.log(`- ${owner.email} (ID: ${owner.id})`);
      });
      
      // Check if these truck owners have credit accounts
      console.log('\nChecking credit accounts for truck owners:');
      for (const owner of truckOwnersResult.rows) {
        const creditResult = await pool.query(`
          SELECT * FROM credit_accounts WHERE "userId" = $1
        `, [owner.id]);
        
        console.log(`${owner.email}:`, creditResult.rows.length > 0 ? '✅ Has account' : '❌ No account');
        if (creditResult.rows.length > 0) {
          console.log('  Account details:', creditResult.rows[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();