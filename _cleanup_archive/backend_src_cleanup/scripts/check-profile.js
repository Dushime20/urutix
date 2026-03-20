const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

async function checkProfile() {
  try {
    // The truck owner from the logs
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    
    // Check if profile exists for this user
    const res = await pool.query(`
      SELECT up.*, u.email 
      FROM user_profiles up
      RIGHT JOIN users u ON u.id = up.user_id
      WHERE u.id = $1
    `, [ownerId]);
    
    console.log('Profile for truck owner:', JSON.stringify(res.rows, null, 2));
    
    // Also check what profiles exist
    const all = await pool.query(`
      SELECT up.user_id, up."firstName", up."lastName", u.email
      FROM user_profiles up
      JOIN users u ON u.id = up.user_id
      LIMIT 5
    `);
    console.log('\nSample profiles:', JSON.stringify(all.rows, null, 2));
    
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

checkProfile();
