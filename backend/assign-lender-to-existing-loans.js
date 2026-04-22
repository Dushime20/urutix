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
    
    // Get all pending loans without lender_id
    const loansWithoutLender = await client.query(`
      SELECT id, tenant_id, requested_amount, status, created_at 
      FROM loan_requests 
      WHERE lender_id IS NULL AND status = 'pending'
    `);
    
    console.log(`Found ${loansWithoutLender.rows.length} pending loans without lender assignment`);
    
    if (loansWithoutLender.rows.length === 0) {
      console.log('No loans to process');
      await client.end();
      return;
    }
    
    // Get active lenders
    const activeLenders = await client.query(`
      SELECT l.id, l.name, l.status,
             COALESCE(p.max_advance_per_trip, 100000) as max_advance,
             COALESCE(p.max_exposure, 1000000) as max_exposure
      FROM lenders l
      LEFT JOIN lender_policies p ON l.id = p.lender_id
      WHERE l.status = 'active'
    `);
    
    console.log(`\nFound ${activeLenders.rows.length} active lenders:`);
    activeLenders.rows.forEach(lender => {
      console.log(`  - ${lender.name} (${lender.id})`);
      console.log(`    Max advance: ${lender.max_advance}, Max exposure: ${lender.max_exposure}`);
    });
    
    // Process each loan
    for (const loan of loansWithoutLender.rows) {
      console.log(`\nProcessing loan ${loan.id}:`);
      console.log(`  Requested amount: ${loan.requested_amount}`);
      
      // Find suitable lender
      let assignedLender = null;
      
      for (const lender of activeLenders.rows) {
        // Check if loan amount is within per-trip limit
        if (parseFloat(loan.requested_amount) > parseFloat(lender.max_advance)) {
          console.log(`  ✗ ${lender.name}: Amount exceeds max advance (${lender.max_advance})`);
          continue;
        }
        
        // Check current exposure
        const exposureResult = await client.query(`
          SELECT COALESCE(SUM(requested_amount), 0) as current_exposure
          FROM loan_requests
          WHERE lender_id = $1 
          AND status IN ('pending', 'approved', 'disbursed')
        `, [lender.id]);
        
        const currentExposure = parseFloat(exposureResult.rows[0].current_exposure);
        const newExposure = currentExposure + parseFloat(loan.requested_amount);
        
        console.log(`  ? ${lender.name}: Current exposure ${currentExposure}, new would be ${newExposure}`);
        
        if (newExposure <= parseFloat(lender.max_exposure)) {
          assignedLender = lender;
          console.log(`  ✓ ${lender.name}: SELECTED!`);
          break;
        } else {
          console.log(`  ✗ ${lender.name}: Would exceed max exposure (${lender.max_exposure})`);
        }
      }
      
      if (assignedLender) {
        // Assign lender to loan
        await client.query(`
          UPDATE loan_requests 
          SET lender_id = $1, updated_at = NOW()
          WHERE id = $2
        `, [assignedLender.id, loan.id]);
        
        console.log(`  ✅ Assigned lender ${assignedLender.name} to loan ${loan.id}`);
      } else {
        console.log(`  ❌ No suitable lender found for loan ${loan.id}`);
      }
    }
    
    console.log('\n✅ Lender assignment complete!');
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
