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
    
    // Check total loan_requests
    const totalLoans = await client.query('SELECT COUNT(*) FROM loan_requests');
    console.log('Total loan_requests:', totalLoans.rows[0].count);
    
    // Check loan_requests with lender_id
    const loansWithLender = await client.query('SELECT COUNT(*) FROM loan_requests WHERE lender_id IS NOT NULL');
    console.log('Loan requests with lender_id:', loansWithLender.rows[0].count);
    
    // Check if the specific lender exists
    const lenderCheck = await client.query('SELECT id, name, contact_email FROM lenders WHERE id = $1', ['12cb9a34-780d-45e9-8f27-94d0df44b85b']);
    console.log('\nLender exists:', lenderCheck.rows.length > 0 ? 'YES' : 'NO');
    if (lenderCheck.rows.length > 0) {
      console.log('Lender details:', JSON.stringify(lenderCheck.rows[0], null, 2));
    }
    
    // Check loan_requests for this lender
    const lenderLoans = await client.query('SELECT id, status, requested_amount, lender_id, created_at FROM loan_requests WHERE lender_id = $1 LIMIT 5', ['12cb9a34-780d-45e9-8f27-94d0df44b85b']);
    console.log('\nLoans for this lender:', lenderLoans.rows.length);
    if (lenderLoans.rows.length > 0) {
      console.log('Sample loans:', JSON.stringify(lenderLoans.rows, null, 2));
    }
    
    // Check all distinct lender_ids in loan_requests
    const distinctLenders = await client.query('SELECT DISTINCT lender_id FROM loan_requests WHERE lender_id IS NOT NULL LIMIT 10');
    console.log('\nDistinct lender_ids in loan_requests:', distinctLenders.rows.length);
    console.log('Sample lender_ids:', JSON.stringify(distinctLenders.rows, null, 2));
    
    // Check all lenders
    const allLenders = await client.query('SELECT id, name, contact_email FROM lenders LIMIT 10');
    console.log('\nAll lenders in system:', allLenders.rows.length);
    console.log('Sample lenders:', JSON.stringify(allLenders.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
