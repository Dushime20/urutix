const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix'
});

const USER_ID = '21664d5c-3532-4e37-8d70-2510dbed7104';

async function checkDriver() {
  try {
    await client.connect();
    
    // Check if user exists
    const userRes = await client.query('SELECT id, email, role FROM users WHERE id = $1', [USER_ID]);
    const user = userRes.rows[0];
    if (user) {
      console.log(`User ID: ${user.id}`);
      console.log(`User Email: ${user.email}`);
      console.log(`User Role: ${user.role}`);
      
      // Check if driver exists for this user email
      const driverRes = await client.query('SELECT id, "userId", email FROM drivers WHERE email ILIKE $1 OR "userId" = $2', [user.email, USER_ID]);
      if (driverRes.rows.length === 0) {
        console.log('No driver found for this user email or ID');
      } else {
        driverRes.rows.forEach(d => {
          console.log(`DRIVER ID: ${d.id}`);
          console.log(`DRIVER UserID in DB: ${d.userId}`);
          console.log(`DRIVER email in DB: ${d.email}`);
        });
      }
    } else {
      console.log('No user record found with ID:', USER_ID);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkDriver();
