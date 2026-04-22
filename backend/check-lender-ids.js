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
    
    console.log('=== Checking ID: 8419dc5a-7efd-49d6-af6a-6775e8f13d26 ===\n');
    
    // Check if this is a User ID
    const userCheck = await client.query('SELECT id, email, role FROM users WHERE id = $1', ['8419dc5a-7efd-49d6-af6a-6775e8f13d26']);
    if (userCheck.rows.length > 0) {
      console.log('✓ Found as USER:');
      console.log(JSON.stringify(userCheck.rows[0], null, 2));
    } else {
      console.log('✗ Not found in users table');
    }
    
    // Check if this is a Lender entity ID
    const lenderCheck = await client.query('SELECT id, name, contact_email FROM lenders WHERE id = $1', ['8419dc5a-7efd-49d6-af6a-6775e8f13d26']);
    if (lenderCheck.rows.length > 0) {
      console.log('\n✓ Found as LENDER entity:');
      console.log(JSON.stringify(lenderCheck.rows[0], null, 2));
    } else {
      console.log('\n✗ Not found in lenders table');
    }
    
    // Check if there's a lender with this user's email
    if (userCheck.rows.length > 0) {
      const userEmail = userCheck.rows[0].email;
      const lenderByEmail = await client.query('SELECT id, name, contact_email FROM lenders WHERE contact_email = $1', [userEmail]);
      if (lenderByEmail.rows.length > 0) {
        console.log('\n✓ Found LENDER entity by user email:');
        console.log(JSON.stringify(lenderByEmail.rows[0], null, 2));
      } else {
        console.log('\n✗ No lender entity found with user email:', userEmail);
      }
    }
    
    console.log('\n\n=== Checking ID: 12cb9a34-780d-45e9-8f27-94d0df44b85b ===\n');
    
    // Check the working lender ID
    const workingLender = await client.query('SELECT id, name, contact_email FROM lenders WHERE id = $1', ['12cb9a34-780d-45e9-8f27-94d0df44b85b']);
    if (workingLender.rows.length > 0) {
      console.log('✓ Found as LENDER entity:');
      console.log(JSON.stringify(workingLender.rows[0], null, 2));
    }
    
    // Check if there's a user with this lender's email
    if (workingLender.rows.length > 0) {
      const lenderEmail = workingLender.rows[0].contact_email;
      const userByEmail = await client.query('SELECT id, email, role FROM users WHERE email = $1', [lenderEmail]);
      if (userByEmail.rows.length > 0) {
        console.log('\n✓ Found USER with lender email:');
        console.log(JSON.stringify(userByEmail.rows[0], null, 2));
      } else {
        console.log('\n✗ No user found with lender email:', lenderEmail);
      }
    }
    
    console.log('\n\n=== All Lenders in System ===\n');
    const allLenders = await client.query('SELECT id, name, contact_email FROM lenders');
    console.log(JSON.stringify(allLenders.rows, null, 2));
    
    console.log('\n\n=== All Users with LENDER role ===\n');
    const allLenderUsers = await client.query("SELECT id, email, role FROM users WHERE role = 'LENDER'");
    console.log(JSON.stringify(allLenderUsers.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
