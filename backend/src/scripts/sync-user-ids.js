const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

async function syncUserIds() {
  try {
    // First, let's see all profiles
    const all = await pool.query(`
      SELECT id, user_id, "userId", "firstName", "lastName" 
      FROM user_profiles 
      LIMIT 10
    `);
    console.log('All profiles:');
    all.rows.forEach(r => {
      console.log(`  Profile: ${r.firstName} ${r.lastName} | userId=${r.userId} | user_id=${r.user_id}`);
    });
    
    // Update all profiles to set user_id = userId where user_id is null
    const result = await pool.query(`
      UPDATE user_profiles 
      SET user_id = "userId" 
      WHERE user_id IS NULL AND "userId" IS NOT NULL
    `);
    console.log(`\nUpdated ${result.rowCount} profiles to sync user_id column`);
    
    // Verify the truck owner's profile
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    const verify = await pool.query(`
      SELECT user_id, "userId", "firstName", "lastName", "companyName" 
      FROM user_profiles WHERE "userId" = $1
    `, [ownerId]);
    console.log('\nTruck owner profile after fix:', JSON.stringify(verify.rows[0], null, 2));
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

syncUserIds();
