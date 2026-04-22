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
    
    // Get all loan_requests details
    const allLoans = await client.query('SELECT * FROM loan_requests');
    console.log('All loan_requests in database:');
    console.log(JSON.stringify(allLoans.rows, null, 2));
    
    // Check borrowers
    const borrowers = await client.query('SELECT id, company_name, email FROM borrowers LIMIT 5');
    console.log('\nBorrowers in system:', borrowers.rows.length);
    console.log(JSON.stringify(borrowers.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
