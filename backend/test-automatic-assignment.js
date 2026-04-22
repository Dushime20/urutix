const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urutix'
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Get a tenant and cargo for testing
    const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found in database');
      await client.end();
      return;
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`Using tenant: ${tenantId}`);
    
    // Get or create a load (cargo)
    let loadResult = await client.query('SELECT id FROM loads LIMIT 1');
    let cargoId;
    
    if (loadResult.rows.length === 0) {
      console.log('No loads found, you need to create a load first via the application');
      console.log('Or use an existing load ID from your database\n');
      await client.end();
      return;
    } else {
      cargoId = loadResult.rows[0].id;
      console.log(`Using existing load: ${cargoId}`);
    }
    
    // Check active lenders
    const lendersResult = await client.query(`
      SELECT id, name, status FROM lenders WHERE status = 'active'
    `);
    console.log(`\nActive lenders: ${lendersResult.rows.length}`);
    lendersResult.rows.forEach(lender => {
      console.log(`  - ${lender.name} (${lender.id})`);
    });
    
    if (lendersResult.rows.length === 0) {
      console.log('\n❌ No active lenders found. Cannot test automatic assignment.');
      await client.end();
      return;
    }
    
    console.log('\n📝 Test Instructions:');
    console.log('1. Restart your backend server to load the updated code');
    console.log('2. Create a new loan request via API WITHOUT specifying lender_id:');
    console.log('\nPOST http://localhost:3005/api/lending/loan-requests');
    console.log('Content-Type: application/json');
    console.log('Authorization: Bearer <your-token>\n');
    console.log(JSON.stringify({
      tenant_id: tenantId,
      cargo_id: cargoId,
      trip_id: cargoId, // Using cargo_id as trip_id for simplicity
      requested_amount: 15000,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }, null, 2));
    
    console.log('\n3. Check the backend logs for automatic assignment messages:');
    console.log('   - "processLoanRequest: Starting automatic lender assignment"');
    console.log('   - "findSuitableLender: Found X active lenders to evaluate"');
    console.log('   - "findSuitableLender: ✓ Selected lender..."');
    console.log('   - "processLoanRequest: Successfully assigned lender to loan"');
    
    console.log('\n4. Verify the loan has a lender_id assigned:');
    console.log('   GET http://localhost:3005/api/lending/lenders/<lender-id>/loan-requests');
    
    console.log('\n💡 The loan should automatically be assigned to one of the active lenders!');
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
