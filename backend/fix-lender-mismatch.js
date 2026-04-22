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
    
    console.log('=== Fixing Lender ID Mismatch ===\n');
    
    const userId = '8419dc5a-7efd-49d6-af6a-6775e8f13d26';
    const correctLenderId = '12cb9a34-780d-45e9-8f27-94d0df44b85b';
    const wrongLenderId = '8419dc5a-7efd-49d6-af6a-6775e8f13d26';
    
    // Check current state
    console.log('Current state:');
    const user = await client.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
    console.log('User:', JSON.stringify(user.rows[0], null, 2));
    
    const wrongLender = await client.query('SELECT id, name, contact_email FROM lenders WHERE id = $1', [wrongLenderId]);
    console.log('\nWrong Lender (Default Lender):', JSON.stringify(wrongLender.rows[0], null, 2));
    
    const correctLender = await client.query('SELECT id, name, contact_email FROM lenders WHERE id = $1', [correctLenderId]);
    console.log('\nCorrect Lender (Bank of Kigali):', JSON.stringify(correctLender.rows[0], null, 2));
    
    // Check if Default Lender has any loans
    const loansOnWrongLender = await client.query('SELECT COUNT(*) FROM loan_requests WHERE lender_id = $1', [wrongLenderId]);
    console.log('\nLoans on Default Lender:', loansOnWrongLender.rows[0].count);
    
    const loansOnCorrectLender = await client.query('SELECT COUNT(*) FROM loan_requests WHERE lender_id = $1', [correctLenderId]);
    console.log('Loans on Bank of Kigali:', loansOnCorrectLender.rows[0].count);
    
    // Solution options
    console.log('\n\n=== SOLUTION OPTIONS ===\n');
    console.log('Option 1: Delete "Default Lender" (if it has no loans)');
    console.log('Option 2: Change "Default Lender" ID to a new UUID');
    console.log('Option 3: Update "Default Lender" email to match user email\n');
    
    if (loansOnWrongLender.rows[0].count === '0') {
      console.log('✓ Default Lender has no loans, safe to delete\n');
      console.log('Executing: DELETE FROM lenders WHERE id = \'' + wrongLenderId + '\'');
      
      await client.query('DELETE FROM lenders WHERE id = $1', [wrongLenderId]);
      
      console.log('✅ Deleted "Default Lender"\n');
      
      // Verify
      const remainingLenders = await client.query('SELECT id, name, contact_email FROM lenders');
      console.log('Remaining lenders:');
      console.log(JSON.stringify(remainingLenders.rows, null, 2));
      
      console.log('\n✅ FIX COMPLETE!');
      console.log('\nNow when user logs in with ID ' + userId);
      console.log('The backend will:');
      console.log('1. Not find a lender with ID ' + userId);
      console.log('2. Look up user by ID and get email: lixome8701@spotshops.com');
      console.log('3. Find lender by email: Bank of Kigali (' + correctLenderId + ')');
      console.log('4. Return loans for Bank of Kigali ✓');
      
    } else {
      console.log('⚠️  Default Lender has ' + loansOnWrongLender.rows[0].count + ' loans');
      console.log('Cannot delete. Need to migrate loans first or use Option 2/3');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
